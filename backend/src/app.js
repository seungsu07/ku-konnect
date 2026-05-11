
/**
 * @import { RequestHandler } from 'express'
 * @import { RunningController } from './controller'
 * @import { ServerContext } from './server'
 * @import { Path, Scheme, PATH_ROUTE, TypeGuarder, TypeGuardObject, MethodOf } from '../../common/dto'
 */

import express from 'express';
import { Temporal } from '@js-temporal/polyfill';
import { makeStringGuarder, makeNumberGuarder, makeBooleanGuarder, makeUndefinedGuarder, makeArrayGuarder, makeObjectGuarder } from '../../common/dto.ts';





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
    function makeUUIDGuarder(e) {
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
    
    const G = {
        s: makeStringGuarder(new ParseError('This field needed to be string', [])),
        n: makeNumberGuarder(new ParseError('This field needed to be number', [])),
        b: makeBooleanGuarder(new ParseError('This field needed to be boolean', [])),
        u: makeUndefinedGuarder(new ParseError('This field needed to be undefined', [])),
        id: makeUUIDGuarder(new ParseError('This field needed to be UUID', [])),
        a: makeArrayGuarder(new ParseError('This field needed to be array', [])),
        o: makeObjectGuarder(new ParseError('This field needed to be object', []))
    };
    
    /**
     * @template T, E
     * @param {TypeGuardObject<T, E>} o
     * @returns {TypeGuarder<T, E>}
     */
    function solveGuardObject(o) {
        return (t) => {
            const obg = G.o(t);
            if (obg instanceof ParseError)
                return new ParseError(obg.message, []);
            const entries = Object.entries(o).map(([k, v]) => [k, v(t[k])]);
            const errIndex= entries.findIndex(([_, v]) => v instanceof ParseError);
            let error;
            if (errIndex != -1) {
                /** @type {[string, ParseError]} */
                const [k, v] =/** @type {any} */ (entries[errIndex]);
                error = new ParseError(v.message, v.path.concat([k]));
            }
            return error? error: Object.fromEntries(entries)
        };
    }
    
    /** @type {{ [K in Path]: { [L in MethodOf<K>]: TypeGuarder<Scheme<K, L, 'REQ'>, ParseError> } }} */
    const guarders = {
        '/api/auth/login': {
            POST: solveGuardObject({
                id: G.id,
                password: G.s
            })
        },
        '/api/auth/signup': {
            POST: solveGuardObject({
                campus: G.id,
                college: G.id,
                department: G.id,
                student_id: (t) =>
                    /^20[12][0-9]{7}$/.test(t)? t:
                    new ParseError('This field needed to be student id', []),
                name: G.s,
                login_id: G.s,
                password: G.s,
                univ_mail: solveGuardObject({
                    address:  (t) =>
                        /^.+@[0-9A-z]+\.[0-9A-z]{2,6}$/.test(t)? t:
                        new ParseError('This field needed to be email address', []),
                    token: G.id
                })
            })
        },
        '/api/data/timetable': {
            GET: solveGuardObject({
                id: G.id
            })
        },
        '/api/auth/verify/mail': {
            GET: solveGuardObject({
                address: (t) =>
                    /^.+@[0-9A-z]+\.[0-9A-z]{2,6}$/.test(t)? t:
                    new ParseError('This field needed to be email address', [])
            }),
            POST: solveGuardObject({
                address:  (t) =>
                    /^.+@[0-9A-z]+\.[0-9A-z]{2,6}$/.test(t)? t:
                    new ParseError('This field needed to be email address', []),
                code: (t) =>
                    /[0-9]{6}/.test(t)? t:
                    new ParseError('This field needed to be 6-digit code', [])
            })
        }
    };
    
    /**
     * @template {Path} T
     * @template {MethodOf<T>} U
     * @template V
     * @param {T} path
     * @param {U} method
     * @param {RequestHandler<V, Scheme<T, U, 'RES'>, Scheme<T, U, 'REQ'>>} fn
     * @returns {[T, RequestHandler<V, Scheme<T, U, 'RES'>, Scheme<T, U, 'REQ'>>]}
     */
    function makeHandler(path, method, fn) {
        /** @type {RequestHandler<V, Scheme<T, U, 'RES'>, Scheme<T, U, 'REQ'>>} */
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
                        ', at \'' + gdata.path.reverse().join('.') + '\'': ''}`
                }));
                return;
            }
            req.body = gdata;
            fn(req, res, next);
            return;
        }
        return [path, handler];
    }

    const app = express();

    app.use(express.json());

    app.use(/** @type {express.ErrorRequestHandler} */
        (err, req, res, next) => {
            res.status(400).json({ e: 'invalid json scheme' });
            return;
        }
    );
    
    app.post(...makeHandler('/api/auth/signup', 'POST', (req, res, next) => {
        res.status(200).end('congrats.');
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