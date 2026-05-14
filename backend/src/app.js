/**
 * @import { RequestHandler } from 'express'
 * @import { RunningController } from './controller'
 * @import { ServerContext } from './server'
 * @import { Path, Scheme, TypeGuarder, TypeGuardObject, MethodOf, ErrorString, PickIndices } from '../../common/dto'
 * @import { CourseType, Day, Semester, Period, User } from '../../common/models'
 */

import express from 'express';
import cookieParser from 'cookie-parser';
import { Temporal } from '@js-temporal/polyfill';
import { stringGuarder, numberGuarder, booleanGuarder, undefinedGuarder, arrayGuarder, objectGuarder, nullGuarder } from '../../common/dto.ts';





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
    function ParseError(message, path=[]) {
        this.message = message;
        this.path = path;
        return this;
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
                return new ParseError(og.message);
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
                return new ParseError(ag.message);
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
     * @template {TypeGuarder<any, ParseError>[]} T
     * @param {T} gs
     * @param {string | undefined} msg
     * @returns {TypeGuarder<{ [K in keyof T]: T[K] extends TypeGuarder<infer U, ParseError>? U: never; }[number], ParseError>}
     */
    function anyGuarder(gs, msg=undefined) {
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
            err = new ParseError(
                msg?? /** @type {ParseError} */ (err).message,
                /** @type {ParseError} */ (err).path
            );
            return err;
        };
    }
    
    /**
     * @template T
     * @param {TypeGuarder<T, ParseError>} g
     * @param {string} msg
     * @returns {TypeGuarder<T | undefined, ParseError>}
     */
    function optGuarder(g, msg=' or undefined') {
        return (t) =>
            G.u(t) instanceof ParseError?
                ((r) => r instanceof ParseError?
                    new ParseError(r.message + msg):
                    r
                )(g(t)):
                undefined;
    }
    
    const G = {
        s: stringGuarder(new ParseError('This field needed to be string')),
        n: numberGuarder(new ParseError('This field needed to be number')),
        b: booleanGuarder(new ParseError('This field needed to be boolean')),
        u: undefinedGuarder(new ParseError('This field needed to be undefined')),
        id: UUIDGuarder(new ParseError('This field needed to be UUID')),
        a: arrayGuarder(new ParseError('This field needed to be array')),
        o: objectGuarder(new ParseError('This field needed to be object')),
        nl: nullGuarder(new ParseError('This field needed to be null')),
    };
    
    /** @type {{ [K in Path]: { [L in MethodOf<K>]: TypeGuarder<Scheme<K, L, 'REQ'>, ParseError> } }} */
    const guarders = {
        '/api/auth/login': {
            POST: gObjectGuarder({
                id: G.s,
                password: G.s
            })
        },
        '/api/auth/signup': {
            POST: gObjectGuarder({
                campus: G.id,
                college: G.id,
                department: G.id,
                student_id: (t) =>
                    /^20[12][0-9]{7}$/.test(t)? String(t):
                    new ParseError('This field needed to be student id'),
                name: G.s,
                login_id: G.s,
                password: G.s,
                univ_mail: gObjectGuarder({
                    address:  (t) =>
                        /^.+@korea\.ac\.kr$/.test(t)? String(t):
                        new ParseError('This field needed to be \'korea.ac.kr\' email address'),
                    token: G.id
                })
            })
        },
        '/api/auth/verify/mail': {
            GET: gObjectGuarder({
                address: (t) =>
                    /^.+@[0-9A-Za-z]+(?:\.[0-9A-Za-z]+){1,3}$/.test(t)? String(t):
                    new ParseError('This field needed to be email address')
            }),
            POST: gObjectGuarder({
                address:  (t) =>
                    /^.+@[0-9A-Za-z]+(?:\.[0-9A-Za-z]+){1,3}$/.test(t)? String(t):
                    new ParseError('This field needed to be email address'),
                code: (t) =>
                    /[0-9]{6}/.test(t)? String(t):
                    new ParseError('This field needed to be 6-digit code')
            })
        },
        '/api/auth/verify/tel': {
            GET: gObjectGuarder({ tel: G.s }),
            POST: gObjectGuarder({
                tel: G.s,
                code: (t) =>
                    /[0-9]{6}/.test(t)? String(t):
                    new ParseError('This field needed to be 6-digit code'),
                user: G.id
            })
        },
        '/api/data/user': {
            GET: gObjectGuarder({
                id: G.s
            }),
            PATCH: gObjectGuarder({
                id: G.id,
                data: gObjectGuarder({
                    name: optGuarder(G.s),
                    student_id: optGuarder((t) =>
                        /^20[12][0-9]{7}$/.test(t)? String(t):
                        new ParseError('This field needed to be student id')
                    ),
                    campus: optGuarder(G.id),
                    college: optGuarder(G.id),
                    department: anyGuarder([G.u, gObjectGuarder({
                        major: G.id,
                        minor: anyGuarder(
                            [G.nl, G.id],
                            'This field needed to be UUID or null'
                        ),
                        status: (t) =>
                            /^(?:none|minor|double|advanced)$/.test(t)?
                            /** @type {'none' | 'minor' | 'double' | 'advanced'} */ (String(t)):
                            new ParseError('This field needed to be one of \'none\', \'minor\', \'double\', \'advanced\'')
                    })]),
                    mail: anyGuarder([G.u, gObjectGuarder({
                        address: G.s,
                        token: G.id
                    })]),
                    univ_mail: anyGuarder([G.u, gObjectGuarder({
                        address: (t) =>
                            /^.+@korea\.ac\.kr$/.test(t)? String(t):
                            new ParseError('This field needed to be \'korea.ac.kr\' email address'),
                        token: G.id
                    })]),
                    password: anyGuarder([G.u, gObjectGuarder({
                        before: G.s,
                        after: G.s
                    })])
                })
            }),
            DELETE: gObjectGuarder({
                id: G.s,
                password: G.s
            })
        },
        '/api/data/userprofile': {
            GET: gObjectGuarder({
                id: optGuarder(G.id),
                user: optGuarder(G.id),
                nickname: optGuarder(G.s)
            }),
            POST: gObjectGuarder({
                nickname: G.s,
                image: (t) =>
                    /^[A-Za-z0-9+\/]+={0,2}$/.test(t)? String(t):
                    new ParseError('This field needed to be Base64 string')
            }),
            PATCH: gObjectGuarder({
                id: G.id,
                data: gObjectGuarder({
                    nickname: optGuarder(G.s),
                    image: optGuarder((t) =>
                        /^[A-Za-z0-9+\/]+={0,2}$/.test(t)? String(t):
                        new ParseError('This field needed to be Base64 string')
                    )
                })
            }),
            DELETE: gObjectGuarder({
                id: G.id
            })
        },
        '/api/data/professor': {
            GET: gObjectGuarder({
                id: optGuarder(G.id),
                name: optGuarder(G.s),
                tel: optGuarder((t) =>
                    /^0[0-9]{1,2}-[0-9]{4}-[0-9]{4}$/.test(t)? String(t):
                    new ParseError('This field needed to be telephone number')
                ),
                mail: optGuarder((t) =>
                    /^.+@[0-9A-Za-z]+(?:\.[0-9A-Za-z]+){1,3}$/.test(t)? String(t):
                    new ParseError('This field needed to be email address')
                )
            })
        },
        '/api/data/campus': {
            GET: gObjectGuarder({
                id: optGuarder(G.id),
                name: optGuarder(G.s)
            })
        },
        '/api/data/college': {
            GET: gObjectGuarder({
                id: optGuarder(G.id),
                virtual: optGuarder(G.b),
                code_num: optGuarder(G.n),
                name: optGuarder(G.s),
                campus: optGuarder(G.id)
            })
        },
        '/api/data/department': {
            GET: gObjectGuarder({
                id: optGuarder(G.id),
                code: optGuarder(G.s),
                name: optGuarder(G.s),
                college: optGuarder(G.id)
            })
        },
        '/api/data/course': {
            GET: gObjectGuarder({
                id: optGuarder(G.id),
                code: optGuarder((t) =>
                    /^[A-Za-z]{4}[0-9]{3}$/.test(t)? String(t):
                    new ParseError('This field needed to be course code')
                ),
                name: optGuarder(G.s),
                course_type: optGuarder((t) =>
                    /^(?:major|major_required|general|general_required|inter|inter_required)$/.test(t)? /** @type {CourseType} */ (String(t)):
                    new ParseError('This field needed to be one of \'major\', \'major_required\', \'general\', \'general_required\', \'inter\', \'inter_required\'')
                ),
                department: optGuarder(G.id)
            })
        },
        '/api/data/lecture': {
            GET: gObjectGuarder({
                id: optGuarder(G.id),
                course: optGuarder(G.id),
                ay: optGuarder(G.n),
                sem: optGuarder((t) =>
                    /^(?:first|second|summer|winter)$/.test(t)? /** @type {Semester} */ (String(t)):
                    new ParseError('This field needed to be one of \'first\', \'second\', \'summer\', \'winter\'')
                ),
                professor: optGuarder(G.id),
                hours: optGuarder(G.n),
                lab_hours: optGuarder(G.n),
                credit: optGuarder(G.n)
            })
        },
        '/api/data/lectureclass': {
            GET: gObjectGuarder({
                id: optGuarder(G.id),
                code: optGuarder(G.s),
                lecture: optGuarder(G.id)
            })
        },
        '/api/data/building': {
            GET: gObjectGuarder({
                id: optGuarder(G.id),
                name: optGuarder(G.s),
                location: optGuarder(gObjectGuarder([G.n, G.n]))
            })
        },
        '/api/data/classroom': {
            GET: gObjectGuarder({
                id: optGuarder(G.id),
                building: optGuarder(G.id),
                room: optGuarder(G.s)
            })
        },
        '/api/data/comment': {
            GET: gObjectGuarder({
                id: optGuarder(G.id),
                post: optGuarder(G.id),
                page: optGuarder(G.n)
            }),
            POST: gObjectGuarder({
                post: G.id,
                content: G.s,
                visible: G.b,
                profile: G.id
            }),
            PATCH: gObjectGuarder({
                id: G.id,
                data: gObjectGuarder({
                    content: G.s,
                    visible: G.b
                })
            }),
            DELETE: gObjectGuarder({
                id: G.id
            })
        },
        '/api/data/post': {
            GET: gObjectGuarder({
                id: optGuarder(G.id),
                board: optGuarder(G.id),
                title: optGuarder(G.s),
                content: optGuarder(G.s)
            }),
            POST: gObjectGuarder({
                board: G.id,
                title: G.s,
                content: G.s,
                visible: G.b,
                profile: G.id
            }),
            PATCH: gObjectGuarder({
                id: G.id,
                data: gObjectGuarder({
                    title: optGuarder(G.s),
                    content: optGuarder(G.s),
                    visible: optGuarder(G.b)
                })
            }),
            DELETE: gObjectGuarder({
                id: G.id
            })
        },
        '/api/data/board': {
            GET: gObjectGuarder({
                id: optGuarder(G.id),
                name: optGuarder(G.s)
            })
        },
        '/api/data/timetable': {
            GET: gObjectGuarder({
                id: optGuarder(G.id),
                user: optGuarder(G.id),
                page: optGuarder(G.n)
            }),
            POST: gObjectGuarder({
                name: G.s,
                selected: G.b,
                classes: gArrayGuarder(G.id),
                visible: G.b
            }),
            PATCH: gObjectGuarder({
                id: G.id,
                data: gObjectGuarder({
                    name: optGuarder(G.s),
                    selected: optGuarder(G.b),
                    classes: gArrayGuarder(G.id),
                    visible: optGuarder(G.b)
                })
            }),
            DELETE: gObjectGuarder({
                id: G.id
            })
        },
        '/api/data/graduationprogress': {
            GET: gObjectGuarder({
                user: G.id
            }),
            PATCH: gObjectGuarder({
                id: G.id,
                data: gObjectGuarder({
                    color: anyGuarder([G.u, gObjectGuarder([G.n, G.n, G.n])]),
                    details: anyGuarder([G.u, gArrayGuarder(gObjectGuarder({
                        course: (t) =>
                            /^(?:major|general|inter)(?:_required)?$/.test(t)? /** @type {any} */ (String(t)):
                            new ParseError('This field needed to be course type'),
                        value: gObjectGuarder([G.n, G.n]),
                        color: gObjectGuarder([G.n, G.n, G.n])
                    }))])
                })
            })
        }
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

    app.use(express.json({ limit: '500kb' }));
    
    app.use(cookieParser());

    app.use(/** @type {express.ErrorRequestHandler} */
        (err, req, res, next) => {
            res.status(400).json({ e: 'invalid json scheme' });
            return;
        }
    );
    
    app.get(...makeHandler('/api/auth/verify/mail', 'GET', async (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const result = await context.databaseManager.API.verifyMailGet(data);
        res.status(result.success? 200: 400).json(result);
    }));
    
    app.post(...makeHandler('/api/auth/verify/mail', 'POST', (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const result = context.databaseManager.API.verifyMailPost(data);
        res.status(result.success? 200: 400).json(result);
    }));
    
    app.get(...makeHandler('/api/auth/verify/tel', 'GET', (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const result = context.databaseManager.API.verifyTelGet(data);
        res.status(result.success? 200: 400).json(result);
    }));
    
    app.get(...makeHandler('/api/auth/verify/tel', 'POST', (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const result = context.databaseManager.API.verifyTelPost(data);
        res.status(result.success? 200: 400).json(result);
    }));
    
    app.post(...makeHandler('/api/auth/signup', 'POST', (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const result = context.databaseManager.API.authSignup(data);
        res.status(result.success? 200: 400).json(result);
    }));
    
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
    
    app.get(...makeHandler('/api/data/user', 'GET', (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const user = res.locals.getSessionUser();
        const result = context.databaseManager.API.dataUserGet(data, user);
        res.status(result.success? 200: 400).json(result);
    }));
    
    app.patch(...makeHandler('/api/data/user', 'PATCH', (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const user = res.locals.getSessionUser();
        if (!user) {
            res.status(400).json({ success: false, e: 'unauthorized' });
            return;
        }
        const result = context.databaseManager.API.dataUserPatch(data, user);
        res.status(result.success? 200: 400).json(result);
    }));
    
    app.delete(...makeHandler('/api/data/user', 'DELETE', (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const user = res.locals.getSessionUser();
        if (!user) {
            res.status(400).json({ success: false, e: 'unauthorized' });
            return;
        }
        const result = context.databaseManager.API.dataUserDelete(data, user);
        res.status(result.success? 200: 400).json(result);
    }));
    
    app.get(...makeHandler('/api/data/userprofile', 'GET', (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const result = context.databaseManager.API.dataUserProfileGet(data);
        res.status(result.success? 200: 400).json(result);
    }));
    
    app.post(...makeHandler('/api/data/userprofile', 'POST', (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const user = res.locals.getSessionUser();
        if (!user) {
            res.status(400).json({ success: false, e: 'unauthorized' });
            return;
        }
        const result = context.databaseManager.API.dataUserProfilePost(data, user);
        res.status(result.success? 200: 400).json(result);
    }));
    
    app.patch(...makeHandler('/api/data/userprofile', 'PATCH', (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const user = res.locals.getSessionUser();
        if (!user) {
            res.status(400).json({ success: false, e: 'unauthorized' });
            return;
        }
        const result = context.databaseManager.API.dataUserProfilePatch(data, user);
        res.status(result.success? 200: 400).json(result);
    }));
    
    app.delete(...makeHandler('/api/data/userprofile', 'DELETE', (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const user = res.locals.getSessionUser();
        if (!user) {
            res.status(400).json({ success: false, e: 'unauthorized' });
            return;
        }
        const result = context.databaseManager.API.dataUserProfileDelete(data, user);
        res.status(result.success? 200: 400).json(result);
    }));
    
    app.get(...makeHandler('/api/data/professor', 'GET', (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const result = context.databaseManager.API.dataProfessorGet(data);
        res.status(result.success? 200: 400).json(result);
    }));
    
    app.get(...makeHandler('/api/data/campus', 'GET', (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const result = context.databaseManager.API.dataCampusGet(data);
        res.status(result.success? 200: 400).json(result);
    }));
    
    app.get(...makeHandler('/api/data/college', 'GET', (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const result = context.databaseManager.API.dataCollegeGet(data);
        res.status(result.success? 200: 400).json(result);
    }));
    
    app.get(...makeHandler('/api/data/department', 'GET', (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const result = context.databaseManager.API.dataDepartmentGet(data);
        res.status(result.success? 200: 400).json(result);
    }));
    
    app.get(...makeHandler('/api/data/course', 'GET', (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const result = context.databaseManager.API.dataCourseGet(data);
        res.status(result.success? 200: 400).json(result);
    }));
    
    app.get(...makeHandler('/api/data/lecture', 'GET', (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const result = context.databaseManager.API.dataLectureGet(data);
        res.status(result.success? 200: 400).json(result);
    }));
    
    app.get(...makeHandler('/api/data/lectureclass', 'GET', (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const result = context.databaseManager.API.dataLectureClassGet(data);
        res.status(result.success? 200: 400).json(result);
    }));
    
    app.get(...makeHandler('/api/data/building', 'GET', (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const result = context.databaseManager.API.dataBuildingGet(data);
        res.status(result.success? 200: 400).json(result);
    }));
    
    app.get(...makeHandler('/api/data/classroom', 'GET', (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const result = context.databaseManager.API.dataClassRoomGet(data);
        res.status(result.success? 200: 400).json(result);
    }));
    
    app.get(...makeHandler('/api/data/comment', 'GET', (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const user = res.locals.getSessionUser();
        const result = context.databaseManager.API.dataCommentGet(data, user);
        res.status(result.success? 200: 400).json(result);
    }));
    
    app.post(...makeHandler('/api/data/comment', 'POST', (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const user = res.locals.getSessionUser();
        if (!user) {
            res.status(400).json({ success: false, e: 'unauthorized' });
            return;
        }
        const result = context.databaseManager.API.dataCommentPost(data, user);
        res.status(result.success? 200: 400).json(result);
    }));
    
    app.patch(...makeHandler('/api/data/comment', 'PATCH', (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const user = res.locals.getSessionUser();
        if (!user) {
            res.status(400).json({ success: false, e: 'unauthorized' });
            return;
        }
        const result = context.databaseManager.API.dataCommentPatch(data, user);
        res.status(result.success? 200: 400).json(result);
    }));
    
    app.delete(...makeHandler('/api/data/comment', 'DELETE', (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const user = res.locals.getSessionUser();
        if (!user) {
            res.status(400).json({ success: false, e: 'unauthorized' });
            return;
        }
        const result = context.databaseManager.API.dataCommentDelete(data, user);
        res.status(result.success? 200: 400).json(result);
    }));
    
    app.get(...makeHandler('/api/data/post', 'GET', (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const user = res.locals.getSessionUser();
        const result = context.databaseManager.API.dataPostGet(data, user);
        res.status(result.success? 200: 400).json(result);
    }));
    
    app.post(...makeHandler('/api/data/post', 'POST', (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const user = res.locals.getSessionUser();
        if (!user) {
            res.status(400).json({ success: false, e: 'unauthorized' });
            return;
        }
        const result = context.databaseManager.API.dataPostPost(data, user);
        res.status(result.success? 200: 400).json(result);
    }));
    
    app.patch(...makeHandler('/api/data/post', 'PATCH', (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const user = res.locals.getSessionUser();
        if (!user) {
            res.status(400).json({ success: false, e: 'unauthorized' });
            return;
        }
        const result = context.databaseManager.API.dataPostPatch(data, user);
        res.status(result.success? 200: 400).json(result);
    }));
    
    app.delete(...makeHandler('/api/data/post', 'DELETE', (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const user = res.locals.getSessionUser();
        if (!user) {
            res.status(400).json({ success: false, e: 'unauthorized' });
            return;
        }
        const result = context.databaseManager.API.dataPostDelete(data, user);
        res.status(result.success? 200: 400).json(result);
    }));
    
    app.get(...makeHandler('/api/data/board', 'GET', (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const result = context.databaseManager.API.dataBoardGet(data);
        res.status(result.success? 200: 400).json(result);
    }));
    
    app.get(...makeHandler('/api/data/timetable', 'GET', (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const user = res.locals.getSessionUser();
        const result = context.databaseManager.API.dataTimeTableGet(data, user);
        res.status(result.success? 200: 400).json(result);
    }));
    
    app.post(...makeHandler('/api/data/timetable', 'POST', (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const user = res.locals.getSessionUser();
        if (!user) {
            res.status(400).json({ success: false, e: 'unauthorized' });
            return;
        }
        const result = context.databaseManager.API.dataTimeTablePost(data, user);
        res.status(result.success? 200: 400).json(result);
    }));
    
    app.patch(...makeHandler('/api/data/timetable', 'PATCH', (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const user = res.locals.getSessionUser();
        if (!user) {
            res.status(400).json({ success: false, e: 'unauthorized' });
            return;
        }
        const result = context.databaseManager.API.dataTimeTablePatch(data, user);
        res.status(result.success? 200: 400).json(result);
    }));
    
    app.delete(...makeHandler('/api/data/timetable', 'DELETE', (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const user = res.locals.getSessionUser();
        if (!user) {
            res.status(400).json({ success: false, e: 'unauthorized' });
            return;
        }
        const result = context.databaseManager.API.dataTimeTableDelete(data, user);
        res.status(result.success? 200: 400).json(result);
    }));
    
    app.delete(...makeHandler('/api/data/graduationprogress', 'GET', (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const user = res.locals.getSessionUser();
        if (!user) {
            res.status(400).json({ success: false, e: 'unauthorized' });
            return;
        }
        const result = context.databaseManager.API.dataGraduationProgressGet(data, user);
        res.status(result.success? 200: 400).json(result);
    }));
    
    app.delete(...makeHandler('/api/data/graduationprogress', 'PATCH', (req, res) => {
        if (!context.databaseManager) throw new Error();
        const data = req.body;
        const user = res.locals.getSessionUser();
        if (!user) {
            res.status(400).json({ success: false, e: 'unauthorized' });
            return;
        }
        const result = context.databaseManager.API.dataGraduationProgressPatch(data, user);
        res.status(result.success? 200: 400).json(result);
    }));
    
    app.use(/** @type {express.ErrorRequestHandler} */
        (err, req, res, next) => {
            res.status(500).json({ e: 'unexpected' });
            return;
        }
    );
    
    return {
        controller: rcon.outer,
        
        async serve(delay=Temporal.Duration.from({ minutes: 3 })) {
            const controller = rcon.inner;
            app.listen(3000, '0.0.0.0', (e) => e?
                console.error(e):
                console.log('Express is running')
            );
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
