/**
 * @import { TypeEntity, Entity, EntityType, EntityID, SolvedNestedID, WithoutID, User, Campus, Department, College, Session } from '../../common/models'
 * @import { RouteFunction, Scheme } from '../../common/dto'
 * @import { RunningController, MonoController } from './controller'
 * @import { ServerContext } from './server'
 */

import loki from 'lokijs';
import { Temporal } from '@js-temporal/polyfill';
import crypto from 'node:crypto';
import { generateTimetable } from './algorithm.js';
import JSON_CAMPUSES from '../../common/default/campuses.json' with { type: 'json' };
import JSON_COLLEGES from '../../common/default/colleges.json' with { type: 'json' };
import JSON_DEPARTMENTS from '../../common/default/departments.json' with { type: 'json' };





// ====================
// Database
// ====================

/** @typedef {ReturnType<typeof CreateDatabaseManager>} DatabaseManager */

/**
 * @param {ServerContext} context
 * @param {RunningController} rcon
 */
export function CreateDatabaseManager(context, rcon) {
    const db = new loki('database.json', {
        autoload: true,
        autoloadCallback: () => {
            console.log('Database loaded');
        },
        autosave: true,
        autosaveInterval: 60000,
        autosaveCallback: () => {
            console.log('Database saved');
        }
    });
    
    /** @type {Collection<Entity<EntityType>>} */
    const collection =
        db.getCollection('entities') ??
        (() => {
            const col = db.addCollection('entities', { unique: ['id'], indices: ['type'] });
            col.insert(JSON_CAMPUSES);
            col.insert(JSON_COLLEGES);
            col.insert(JSON_DEPARTMENTS);
            return col;
        })();
    
    /** @type {ServerContext['sessionManager']} */
    let sessionManager;
    
    /**
     * @param {string} password
     * @param {string} salt
     */
    function makehash(password, salt=crypto.randomBytes(8).toHex()) {
        const iterations = 100000;
        const keylen = 64;
        const digest = 'sha512';
        return {
            hash: crypto
                .pbkdf2Sync(password, salt, iterations, keylen, digest)
                .toHex(),
            salt
        };
    }

    /**
     * @param {Temporal.DurationLike} cond
     */
    function duration(cond) {
        return Temporal.Duration.from(cond);
    }

    /**
     * @template {EntityType} T
     * @template {EntityID<T>} U
     * @typedef {{ [K in keyof U]: U[K] extends EntityID<infer V>? SolvedID<V, U[K]>: U[K] }} SolvedID<U>
     */

    /**
     * @template {TypeEntity<EntityType> | EntityID<EntityType>} T
     * @param {T} nested
     * @param {number} max_depth
     * @returns {SolvedNestedID<T>}
     */
    function solveID(nested, max_depth) {
        ++max_depth;
        /** @type {[string, any][][]} */
        const stack = [[['0', nested]]];
        const idx = [0];
        const id_map = new Map();
        let h = 0;
        while (true) {
            if (idx[h] == stack[h].length) {
                if (h == 0) {
                    return stack[0][0][1];
                }
                stack.pop();
                idx.pop();
                --h;
                ++idx[h];
                continue;
            }
            const c = stack[h][idx[h]];
            let [k, v] = c;
            if (
                typeof v == 'string' &&
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v)
            ) {
                if (!id_map.has(v))
                    id_map.set(v, v=dbm.getByID(v))
                else
                    v = id_map.get(v);
                stack[h][idx[h]][1] = v;
            }
            if (h > 0)
                stack[h-1][idx[h-1]][1][k] = v;
            if (v != null && typeof v == 'object' && h <= max_depth) {
                stack.push(Object.entries(v));
                idx.push(0);
                ++h;
                continue;
            }
            ++idx[h];
        }
    }
    
    /** @type {Map<string | EntityID<EntityType>, WeakRef<any>>} */
    const idMap = new Map();

    const dbm = {
        /** @type {MonoController} */
        controller: rcon.outer,
        context: {
            collection,
            idMap
        },
        
        /**
         * @template {EntityType} T
         * @param {string | EntityID<T>} id
         * @returns {TypeEntity<T> | undefined}
         */
        fromIDMap(id) {
            return idMap.get(id)?.deref();
        },
        
        /**
         * @param {Entity<EntityType>} entity
         */
        pushIDMap(entity) {
            idMap.set(entity.id, new WeakRef(entity));
        },
        
        collectIDMap() {/* TODO */},
        
        /**
         * @template {EntityType} T
         * @template {TypeEntity<T>} U
         * @param {WithoutID<U>} param
         * @returns {U | undefined}
         */
        createEntity(param) {
            const idparam = {
                id: crypto.randomUUID(),
                ...param
            };
            const entity = collection.insertOne(idparam);
            if (!entity) return undefined;
            this.pushIDMap(entity);
            return /** @type {any} */ (entity);
        },
        
        /**
         * @template {EntityType} T
         * @param {EntityID<T> | string} id
         * @returns {TypeEntity<T> | undefined}
         */
        getByID(id) {
            const ref = this.fromIDMap(id);
            if (ref) return ref;
            const entity = collection.by('id', id);
            if (!entity) return undefined;
            this.pushIDMap(entity);
            return /** @type {any} */ (entity);
        },
        
        /**
         * @template {EntityType} T
         * @param {LokiQuery<TypeEntity<T>> & { type: T }} query
         * @returns {TypeEntity<T>[]}
         */
        findEntity(query) {
            return collection.chain()
                .find({ ...query })
                .map(e => ({ id: e.id }))
                .data({
                    forceClones: false,
                    removeMeta: true
                })
                .reduce((arr, { id }) => {
                    const ref = this.fromIDMap(id);
                    if (ref) {
                        arr.push(ref);
                        return arr;
                    }
                    const entity = this.getByID(id);
                    if (!entity) return arr;
                    this.pushIDMap(entity);
                    arr.push(entity);
                    return arr;
                }, /** @type {any[]} */ ([]));
        },
        
        /**
         * @template {TypeEntity<EntityType>} T
         * @param {T} entity
         * @returns {T | undefined}
         */
        updateEntity(entity) {
            const result = collection.update(entity);
            return /** @type {any} */ (result);
        },
        
        /**
         * @template {TypeEntity<EntityType>} T
         * @param {T} entity
         * @returns {T | undefined}
         */
        deleteEntity(entity) {
            const result = collection.remove(entity);
            if (!result) return undefined;
            idMap.delete(entity.id);
            return /** @type {any} */ (result);
        },
        
        API: {
            /**
             * /api/auth/signup
             * @method POST
             * @type {RouteFunction<'/api/auth/signup', 'POST'>}
             */
            authSignup(data) {
                if (!sessionManager) throw new Error();
                const mailMgr = sessionManager.context.mailSessionManager;
                if (!mailMgr) throw new Error();
                const {
                    campus: campus_id,
                    college: college_id,
                    department: department_id,
                    student_id,
                    name,
                    login_id,
                    password,
                    univ_mail: {
                        address,
                        token
                    }
                } = data;
                const mailSession = mailMgr.check(token, address);
                if (!mailSession.valid)
                    return {
                        success: false,
                        e: 'mail_not_verified'
                    };
                mailMgr.expire(token);
                const campus = dbm.findEntity({
                    id: campus_id,
                    type: 'campus'
                }).at(0);
                if (!campus)
                    return {
                        success: false,
                        e: 'campus_doesnt_exist'
                    };
                const college = dbm.findEntity({
                    type: 'college',
                    id: college_id,
                    campus: campus.id
                }).at(0);
                if (!college)
                    return {
                        success: false,
                        e: 'college_doesnt_exist'
                    };
                const major = dbm.findEntity({
                    type: 'department',
                    id: department_id,
                    college: college.id
                }).at(0);
                if (!major)
                    return {
                        success: false,
                        e: 'department_doesnt_exist'
                    }
                const { hash, salt } = makehash(password);
                /** @type {WithoutID<User>} */
                const param = {
                    type: 'user',
                    login_id,
                    login_hash: hash,
                    login_salt: salt,
                    name,
                    student_id,
                    campus: campus.id,
                    college: college.id,
                    department: {
                        major: major.id,
                        minor: null,
                        status: 'none'
                    },
                    univ_mail: address,
                    mail: null,
                };
                const user = dbm.createEntity(param);
                return user?
                    {
                        success: true
                    }:
                    {
                        success: false,
                        e: 'unexpected'
                    };
            },
            
            /**
             * /api/auth/login
             * @method POST
             * @type {RouteFunction<'/api/auth/login', 'POST', undefined, { success: false; } | { success: true; token: EntityID<'session'>; }>}
             */
            authLogin(data) {
                if (!sessionManager) throw new Error();
                const loginMgr = sessionManager.context.loginSessionManager;
                if (!loginMgr) throw new Error();
                const {
                    id,
                    password
                } = data;
                const user = dbm.findEntity({
                    type: 'user',
                    login_id: id
                }).at(0);
                if (!user)
                    return {
                        success: false,
                        e: 'user_doesnt_exist'
                    };
                const { hash } = makehash(password, user.login_salt);
                if (user.login_hash != hash)
                    return {
                        success: false,
                        e: 'user_doesnt_exist'
                    };
                const { hash: n_hash, salt } = makehash(password);
                user.login_hash = n_hash;
                user.login_salt = salt;
                if (!dbm.updateEntity(user))
                    return {
                        success: false,
                        e: 'unexpected'
                    };
                const dur = duration({ days: 30 });
                const reg = loginMgr.register(user.id, dur);
                if (!reg)
                    return {
                        success: false,
                        e: 'unexpected'
                    };
                return {
                    success: true,
                    expires_at: reg.expires_at,
                    token: reg.token
                };
            },
            
            /**
             * /api/auth/verify/mail
             * @method GET
             * @type {RouteFunction<'/api/auth/verify/mail', 'GET'>}
             */
            verifyMailGet(data) {
                if (!sessionManager) throw new Error();
                const mailMgr = sessionManager.context.mailSessionManager;
                if (!mailMgr) throw new Error();
                const {
                    address
                } = data;
                if (mailMgr.checkVerify(address))
                    mailMgr.expireVerify(address);
                const mailvSession = mailMgr.registerVerify(address);
                if (!mailvSession)
                    return {
                        success: false,
                        e: 'unexpected'
                    };
                // TODO - send mail
                return {
                    success: true,
                    expires_at: mailvSession.expires_at
                };
            },
            
            /**
             * /api/auth/verify/mail
             * @method POST
             * @type {RouteFunction<'/api/auth/verify/mail', 'POST'>}
             */
            verifyMailPost(data) {
                if (!sessionManager) throw new Error();
                const mailMgr = sessionManager.context.mailSessionManager;
                if (!mailMgr) throw new Error();
                const {
                    address,
                    code
                } = data;
                const mailvSession = mailMgr.checkVerify(address);
                if (!mailvSession.valid)
                    return {
                        success: false,
                        e: 'try_get_verifying_code'
                    };
                if (code != mailvSession.code)
                    return {
                        success: false,
                        e: 'code_doesnt_match'
                    };
                mailMgr.expireVerify(address);
                const mailSession = mailMgr.register(address);
                if (!mailSession)
                    return {
                        success: false,
                        e: 'unexpected'
                    };
                return {
                    success: true,
                    token: mailSession.token,
                    expires_at: mailSession.expires_at
                };
            },
            
            /**
             * /api/data/timetable
             * @method POST
             * @type {RouteFunction<'/api/data/timetable', 'GET', User>}
             */
            dataTimetable(data, user) {
                const { id } = data;
                const timetable = dbm.getByID(id);
                if (!timetable)
                    return {
                        success: false,
                        e: 'timetable_doesnt_exist'
                    };
                if (timetable.user != user.id)
                    return {
                        success: false,
                        e: 'timetable_doesnt_exist'
                    };
                return {
                    success: true,
                    data: timetable
                };
            }
        },

        /**
         * @returns {Promise<void>}
         */
        async serve(delay = Temporal.Duration.from({ minutes: 3 })) {
            sessionManager = context.sessionManager;
            if (!sessionManager) throw new Error();
            const controller = rcon.inner;
            await controller.start();

            while (true) {
                const { promise: db_save, resolve: db_save_resv } = Promise.withResolvers();
                db.save(db_save_resv);
                const err = await db_save;
                if (err) console.error(err);
                const { promise: delay_prom, resolve } = Promise.withResolvers();
                setTimeout(resolve, delay.total('millisecond'));
                await Promise.any([delay_prom, controller.waitFor(false)]);
                if (controller.isPendingFor().stop) {
                    break;
                }
            }
            
            const { promise: db_close, resolve: db_close_resv } = Promise.withResolvers();
            db.close(db_close_resv);
            await db_close;
            await controller.stop();
        }
    };
    
    return dbm;
}