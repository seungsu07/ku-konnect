
/**
 * @import { RequestHandler } from 'express'
 * @import { RunningController } from './controller'
 * @import { ServerContext } from './server'
 * @import { Path, Scheme, TypeGuarder, TypeGuardObject, MethodOf, ErrorString, PickIndices } from '../../common/dto'
 * @import { User } from '../../common/models'
 */

import express from 'express';
import cookieParser from 'cookie-parser';
import { Temporal } from '@js-temporal/polyfill';
import { stringGuarder, numberGuarder, booleanGuarder, undefinedGuarder, arrayGuarder, objectGuarder } from '../../common/dto.ts';





// ====================
// Express
// ====================

/** @typedef {ReturnType<typeof CreateAppManager>} AppManager */

/**
 * @param {ServerContext} context
 * @param {RunningController} rcon
 */
export function CreateAppManager(context, rcon) {
    /**
     * @typedef {`${string}-${string}-${string}-${string}-${string}`} UUID
     */
    
    /**
     * @param {string} t
     * @returns {t is UUID}
     */
    function checkUUID(t) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(t);
    }
    
    /**
     * @template {any} E
     * @param {E} e
     * @returns {TypeGuarder<UUID, E>}
     */
    function UUIDGuarder(e) {
        return (t) => typeof t == 'string' && checkUUID(t)? t: e;
    }
    
    /**
     * @constructor
     * @param {string} message
     * @param {string[]} path
     * @property {string} message
     * @property {string[]} path
     */
    function ParseError(message, path) {
        this.message = message;
        this.path = path;
        return this;
    }
    
    /**
     * @template T
     * @param {string} msg
     * @param {TypeGuarder<T, ParseError>[]} gs
     * @returns {TypeGuarder<T, ParseError>}
     */
    function anyGuarder(msg, ...gs) {
        return (t) => {
            /** @type {ParseError?} */
            let err = null;
            for (const g of gs) {
                const res = g(t);
                if (res instanceof ParseError)
                    err = res;
                else
                    return res;
            }
            err = new ParseError(msg, /** @type {ParseError} */ (err).path);
            return err;
        };
    }
    
    /**
     * @template T
     * @param {TypeGuardObject<T, ParseError>} o
     * @returns {TypeGuarder<T, ParseError>}
     * @description Make TypeGuarder for Object, Tuple.
     */
    function gObjectGuarder(o) {
        return (t) => {
            const og = G.o(t);
            if (og instanceof ParseError)
                return new ParseError(og.message, []);
            const tup = Array.isArray(o);
            /** @type {any} */
            const obj = {};
            /** @type {ParseError | undefined} */
            let error;
            return Object.entries(o).every(([k, v]) => {
                const res = v(og[k]);
                if (res instanceof ParseError) {
                    error = new ParseError(res.message, [k, ...res.path]);
                    return false;
                }
                obj[k] = res;
                return true;
            })? tup? Object.values(obj): obj: error;
        };
    }
    
    /**
     * @template T
     * @param {TypeGuarder<T, ParseError>} g
     * @returns {TypeGuarder<T[], ParseError>}
     * @description Make TypeGuarder for non-fixed Array.
     */
    function gArrayGuarder(g) {
        return (t) => {
            const ag = G.a(t);
            if (ag instanceof ParseError)
                return new ParseError(ag.message, []);
            /** @type {any} */
            const arr = [];
            /** @type {ParseError | undefined} */
            let error;
            return ag.every((v, i) => {
                const res = g(v);
                if (res instanceof ParseError) {
                    error = new ParseError(res.message, [`(index ${i})`, ...res.path]);
                    return false;
                }
                arr.push(res);
                return true;
            })? arr: error;
        };
    }
    
    /**
     * @template T
     * @param {TypeGuarder<T, ParseError>} g
     * @param {string | undefined} msg
     * @returns {TypeGuarder<T | undefined, ParseError>}
     */
    function optGuarder(g, msg=undefined) {
        return (t) =>
            G.u(t) instanceof ParseError?
                msg?
                    ((r) => r instanceof ParseError?
                        new ParseError(msg, []):
                        r
                    )(g(t)):
                    g(t):
                undefined;
    }
    
    const G = {
        s: stringGuarder(new ParseError('This field needed to be string', [])),
        n: numberGuarder(new ParseError('This field needed to be number', [])),
        b: booleanGuarder(new ParseError('This field needed to be boolean', [])),
        u: undefinedGuarder(new ParseError('This field needed to be undefined', [])),
        id: UUIDGuarder(new ParseError('This field needed to be UUID', [])),
        a: arrayGuarder(new ParseError('This field needed to be array', [])),
        o: objectGuarder(new ParseError('This field needed to be object', []))
    };
    
    /** @type {{ [K in Path]: { [L in MethodOf<K>]: TypeGuarder<Scheme<K, L, 'REQ'>, ParseError> } }} */
    const guarders = {
        '/api/auth/login': {
            POST: gObjectGuarder({
                id: G.id,
                password: G.s
            })
        },
        '/api/auth/signup': {
            POST: gObjectGuarder({
                campus: G.id,
                college: G.id,
                department: G.id,
                student_id: (t) =>
                    /^20[12][0-9]{7}$/.test(t)? t:
                    new ParseError('This field needed to be student id', []),
                name: G.s,
                login_id: G.s,
                password: G.s,
                univ_mail: gObjectGuarder({
                    address:  (t) =>
                        /^.+@[0-9A-z]+\.[0-9A-z]{2,6}$/.test(t)? t:
                        new ParseError('This field needed to be email address', []),
                    token: G.id
                })
            })
        },
        '/api/auth/verify/mail': {
            GET: gObjectGuarder({
                address: (t) =>
                    /^.+@[0-9A-z]+\.[0-9A-z]{2,6}$/.test(t)? t:
                    new ParseError('This field needed to be email address', [])
            }),
            POST: gObjectGuarder({
                address:  (t) =>
                    /^.+@[0-9A-z]+\.[0-9A-z]{2,6}$/.test(t)? t:
                    new ParseError('This field needed to be email address', []),
                code: (t) =>
                    /[0-9]{6}/.test(t)? t:
                    new ParseError('This field needed to be 6-digit code', [])
            })
        },
        '/api/data/user': {
            GET: gObjectGuarder({
                id: anyGuarder('This field needed to be UUID or undefined', G.u, G.id)
            }),
            POST: gObjectGuarder({
                id: G.id,
                data: gObjectGuarder({
                    name: 
                })
            })
        };
    };
    
    /**
     * @template {Path} T
     * @template {MethodOf<T>} U
     * @template V
     * @param {T} path
     * @param {U} method
     * @param {RequestHandler<V, Scheme<T, U, 'RES'>, Scheme<T, U, 'REQ'>, any, { getSessionUser: () => User | null }>} fn
     * @returns {[T, RequestHandler<V, Scheme<T, U, 'RES'>, Scheme<T, U, 'REQ'>, any, { getSessionUser: () => User | null }>]}
     */
    function makeHandler(path, method, fn) {
        /**
         * @param {Parameters<typeof fn>[0]} req
         * @returns {User | null}
         */
        function getSessionUser(req) {
            const loginMgr = context.sessionManager?.context.loginSessionManager;
            if (!loginMgr) return null;
            const token = req.cookies.token;
            if (!token) return null;
            const result = loginMgr.check(token);
            if (!result.valid) return null;
            const { user_id } = result;
            const user = context.databaseManager?.getByID(user_id);
            return user ?? null;
        }
        
        /** @type {RequestHandler<V, Scheme<T, U, 'RES'>, Scheme<T, U, 'REQ'>, any, { getSessionUser: () => User | null }>} */
        function handler(req, res, next) {
            const data = method == 'GET'?
                req.query: req.body;
            const guarder = guarders[path][method];
            /** @type {ParseError | Scheme<T, U, 'REQ'>} */
            const gdata = /** @type {any} */ (guarder(data));
            if (gdata instanceof ParseError) {
                res.status(400).json(/** @type {any} */ ({
                    success: false,
                    e: `${gdata.message}${gdata.path.length?
                        ', at \'' + gdata.path.join('.') + '\'': ''}`
                }));
                return;
            }
            req.body = gdata;
            res.locals.getSessionUser = getSessionUser.bind(null, req);
            fn(req, res, next);
            return;
        }
        return [path, handler];
    }

    const app = express();

    app.use(express.json());
    
    app.use(cookieParser());

    app.use(/** @type {express.ErrorRequestHandler} */
        (err, req, res, next) => {
            res.status(400).json({ e: 'invalid json scheme' });
            return;
        }
    );
    
    app.post(...makeHandler('/api/auth/login', 'POST', (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const raw = context.databaseManager.API.authLogin(data);
        if (raw.success) {
            const result = {
                success: raw.success,
                expires_at: raw.expires_at
            };
            res.cookie('token', raw.token, {
                expires: new Date(raw.expires_at),
                httpOnly: true
            });
            res.status(200).json(result);
        } else {
            const result = {
                success: raw.success,
                e: raw.e
            }
            res.status(400).json(result);
        }
    }));
    
    app.post(...makeHandler('/api/auth/signup', 'POST', (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const result = context.databaseManager.API.authSignup(data);
        res.status(result.success? 200: 400).json(result);
    }));
    
    app.get(...makeHandler('/api/data/timetable', 'GET', (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const user = res.locals.getSessionUser();
        if (!user) {
            res.status(400).json({ success: false, e: 'unauthorized' });
            return;
        }
        const result = context.databaseManager.API.dataTimetable(data, user);
        res.status(result.success? 200: 400).json(result);
    }));

    app.use(/** @type {express.ErrorRequestHandler} */
        (err, req, res, next) => {
            res.status(500).json({ e: 'unexpected', err });
            return;
        }
    );
    
    return {
        controller: rcon.outer,
        
        async serve(delay=Temporal.Duration.from({ minutes: 3 })) {
            const controller = rcon.inner;
            app.listen(3000);
            await controller.start();
            
            while (true) {
                
                const { promise: delay_prom, resolve } = Promise.withResolvers();
                setTimeout(resolve, delay.total('millisecond'));
                await Promise.any([delay_prom, controller.waitFor(false)]);
                if (controller.isPendingFor().stop) {
                    break;
                }
            }
            
            await controller.stop();
        }
    };
}