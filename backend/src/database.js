/**
 * @import { TypeEntity, Entity, EntityType, EntityID, SolvedNestedID, WithoutID, User, Campus, Department, College, Session, UserProfile, Professor, BoolRecord, Comment, Post, TimeTable, Period, GraduationProgress } from '../../common/models.js'
 * @import { RouteFunction, Scheme } from '../../common/dto.js'
 * @import { RunningController, MonoController } from './controller.js'
 * @import { ServerContext } from './server.js'
 */

import loki from 'lokijs';
import nodemailer from 'nodemailer';
import socks from 'socks';
import { Temporal } from '@js-temporal/polyfill';
import crypto from 'node:crypto';
import JSON_CAMPUSES from '../../common/default/campuses.json' with { type: 'json' };
import JSON_COLLEGES from '../../common/default/colleges.json' with { type: 'json' };
import JSON_DEPARTMENTS from '../../common/default/departments.json' with { type: 'json' };





// ====================
// SMTP
// ====================

const transporter = nodemailer.createTransport(/** @type {any} */ ({
    host: 'smtp-relay.gmail.com',
    port: 587,
    secure: false,
    proxy: 'socks5://127.0.0.1:1080',
    name: 'hydv.kr',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
}));

transporter.set('proxy_socks_module', socks);

/**
 * @param {string} to
 * @param {string} subject
 * @param {string} html
 */
export function sendMail(to, subject, html) {
    return transporter.sendMail({
        from: `"HYDV.KR" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html
    }).then(() => true).catch((e) => (console.error(e), false));
};

/**
 * @param {string} title
 * @param {string} content
 */
function mailTemplate(title, content) {
    return `
    <!DOCTYPE html>
    <html>
        <head>
            <meta charset="UTF-8">
            <title>${title}</title>
        <head>
        <body>
            <h1>${title}</h1>
            <hr>
            ${content}
        </body>
    </html>
    `;
}

// ====================





// ====================
// Database
// ====================

/**
 * @template {(...args: any[]) => any} T
 * @typedef {(...args: Parameters<T>) => Promise<ReturnType<Awaited<T>>>} Asyncify
 */

const NO_ID = '0-0-0-0-0';

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
    
    /**
     * @template {Record<string, any>} T
     * @param {T} obj
     * @return {{ [K in keyof T as T[K] extends undefined? never: K]: T[K]; }}
     */
    function removeEmpty(obj) {
        return /** @type {any} */ (Object.fromEntries(
            Object.entries(obj)
                .filter(([_, v]) => v !== undefined)
        ));
    }
    
    /**
     * @template {Record<string, any>} T
     * @template {{ [K in keyof T]?: any; }} U
     * @param {T} modified
     * @param {U} modifier
     * @returns {BoolRecord<U>}
     */
    function getModified(modified, modifier) {
        return (
            Object.fromEntries(
                Object.entries(modifier)
                .map(([k, v]) => {
                    const n = modified[k];
                    if (Array.isArray(n) && Array.isArray(v))
                        return [k, Array.from({
                            .../** @type {any} */(getModified(n, v)),
                            length: v.length
                        })];
                    if (
                        typeof n == 'object' &&
                        n !== null &&
                        typeof v == 'object' &&
                        v !== null
                    ) return [k, getModified(n, v)];
                    if (
                        typeof n == 'object' &&
                        n !== null ||
                        typeof v == 'object' &&
                        v !== null
                    ) return [k, false];
                    return [k, v === n];
                })
            )
        );
    }
    
    /** @type {Map<string | EntityID<EntityType>, WeakRef<any>>} */
    const idMap = new Map();

    const dbm = {
        /** @type {MonoController} */
        controller: rcon.outer,
        context: {
            collection,
            idMap,
            sendMail
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
         * @template {TypeEntity<EntityType>} T
         * @param {WithoutID<T>} param
         * @returns {T | undefined}
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
         * @param {LokiQuery<TypeEntity<T>> & { type: T } & { [K: `${string}.${string}`]: any; }} query
         * @param {{ limit?: number, offset?: number }} options
         * @returns {TypeEntity<T>[]}
         */
        findEntity(query, options={}) {
            return collection.chain()
                .find(query)
                .offset(options.offset?? 0)
                .limit(options.limit?? 1000)
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
                if (dbm.findEntity({ type: 'user', login_id }).length) return {
                    success: false,
                    e: 'id_exists'
                };
                const mailSession = mailMgr.check(token, address);
                if (!mailSession.valid) return {
                    success: false,
                    e: 'mail_not_verified'
                };
                const campus = dbm.findEntity({
                    id: campus_id,
                    type: 'campus'
                }).at(0);
                if (!campus) return {
                    success: false,
                    e: 'campus_doesnt_exist'
                };
                const college = dbm.findEntity({
                    type: 'college',
                    id: college_id,
                    campus: campus.id
                }).at(0);
                if (!college) return {
                    success: false,
                    e: 'college_doesnt_exist'
                };
                const major = dbm.findEntity({
                    type: 'department',
                    id: department_id,
                    college: college.id
                }).at(0);
                if (!major) return {
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
                if (!user) return {
                    success: false,
                    e: 'unexpected'
                };
                /** @type {WithoutID<GraduationProgress>} */
                const gparam = {
                    type: 'graduation_progress',
                    user: user.id,
                    value: [0, 1],
                    color: [255, 255, 255],
                    details: []
                };
                mailMgr.expire(token);
                const gp = dbm.createEntity(gparam);
                // TODO
                return {
                    success: true
                };
            },
            
            /**
             * /api/auth/login
             * @method POST
             * @type {RouteFunction<'/api/auth/login', 'POST', [], { success: false; } | { success: true; token: EntityID<'session'>; }>}
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
                if (!user) return {
                    success: false,
                    e: 'user_doesnt_exist'
                };
                const { hash } = makehash(password, user.login_salt);
                if (user.login_hash != hash) return {
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
                if (!reg) return {
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
             * @type {Asyncify<RouteFunction<'/api/auth/verify/mail', 'GET'>>}
             */
            async verifyMailGet(data) {
                if (!sessionManager) throw new Error();
                const mailMgr = sessionManager.context.mailSessionManager;
                if (!mailMgr) throw new Error();
                const {
                    address
                } = data;
                if (mailMgr.checkVerify(address))
                    mailMgr.expireVerify(address);
                const mailvSession = mailMgr.registerVerify(address,
                    Temporal.Duration.from({ minutes: 15 })
                );
                if (!mailvSession) return {
                    success: false,
                    e: 'unexpected'
                };
                const res = await sendMail(address, 'KONNECT: 이메일 인증 메일',
                    mailTemplate('KONNECT: 이메일 인증 메일', `
                        이메일 주소 인증을 위해 발송된 이메일입니다.<br>
                        인증 코드는 아래와 같습니다.<br>
                        <b>${mailvSession.code}</b><br>
                        <br>
                        이 코드는 15분 뒤에 만료됩니다.
                    `));
                return res? {
                    success: true,
                    expires_at: mailvSession.expires_at
                }: {
                    success: false,
                    e: 'send_mail_failed'
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
                if (!mailvSession.valid) return {
                    success: false,
                    e: 'try_get_verifying_code'
                };
                if (code != mailvSession.code) return {
                    success: false,
                    e: 'code_doesnt_match'
                };
                mailMgr.expireVerify(address);
                const mailSession = mailMgr.register(address);
                if (!mailSession) return {
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
             * /api/auth/verify/tel
             * @method GET
             * @type {RouteFunction<'/api/auth/verify/tel', 'GET'>}
             */
            // verifyTelGet(data) {
            //     // TODO
            //     return;
            // },
            
            /**
             * /api/auth/verify/tel
             * @method GET
             * @type {RouteFunction<'/api/auth/verify/tel', 'POST'>}
             */
            // verifyTelPost(data) {
            //     // TODO
            //     return;
            // },
            
            /**
             * /api/data/user
             * @method GET
             * @type {RouteFunction<'/api/data/user', 'GET', [User]>}
             */
            dataUserGet(data, user) {
                const { id } = data;
                const t = dbm.findEntity({ type: 'user', 'login_id': id }).at(0);
                if (!t) return {
                    success: false,
                    e: 'unexpected'
                };
                if (id != user.login_id) return {
                    success: false,
                    e: 'no_permission'
                };
                return {
                    success: true,
                    data: {
                        id: t.id,
                        login_id: t.login_id,
                        name: t.name,
                        student_id: t.student_id,
                        campus: t.campus,
                        college: t.college,
                        department: t.department,
                        univ_mail: t.univ_mail,
                        mail: t.mail
                    }
                };
            },
            
            /**
             * /api/data/user
             * @method PATCH
             * @type {RouteFunction<'/api/data/user', 'PATCH', [User]>}
             */
            dataUserPatch(data, user) {
                const {
                    id,
                    data: {
                        name,
                        student_id,
                        campus,
                        college,
                        department,
                        mail,
                        univ_mail,
                        password
                    }
                } = data;
                if (id != user.id) return {
                    success: false,
                    e: 'no_permission'
                };
                const t = dbm.getByID(id);
                if (!t) return {
                    success: false,
                    e: 'unexpected'
                };
                if (t.type != 'user') return {
                    success: false,
                    e: 'user_doesnt_exist'
                };
                const modifier = removeEmpty({
                    name,
                    student_id,
                    campus,
                    college,
                    department
                });
                if (mail) ifb: {
                    if (!sessionManager) break ifb;
                    const res = sessionManager.context.mailSessionManager
                        ?.check(mail.token, mail.address);
                    if (!res?.valid) break ifb;
                    modifier['mail'] = mail.address;
                }
                if (univ_mail) ifb: {
                    if (!sessionManager) break ifb;
                    const res = sessionManager.context.mailSessionManager
                        ?.check(univ_mail.token, univ_mail.address);
                    if (!res?.valid) break ifb;
                    modifier['univ_mail'] = univ_mail.address;
                }
                if (password) ifb: {
                    const { before, after } = password;
                    const { hash: bh } = makehash(before, t.login_salt);
                    if (bh != t.login_hash) break ifb;
                    const { hash, salt } = makehash(after);
                    modifier['login_hash'] = hash;
                    modifier['login_salt'] = salt;
                }
                Object.entries(modifier).forEach(([k, v]) => t[k] = v);
                const res = dbm.updateEntity(t);
                if (!res) return {
                    success: false,
                    e: 'unexpected'
                };
                return {
                    success: true,
                    modified: getModified(res, modifier)
                };
            },
            
            /**
             * /api/data/user
             * @method DELETE
             * @type {RouteFunction<'/api/data/user', 'DELETE', [User]>}
             */
            dataUserDelete(data, user) {
                const { id, password } = data;
                const t = dbm.findEntity({ type: 'user', 'login_id': id }).at(0);
                if (!t) return {
                    success: false,
                    e: 'unexpected'
                };
                if (id != user.login_id) return {
                    success: false,
                    e: 'no_permission'
                };
                const { hash } = makehash(password, t.login_salt);
                if (hash != t.login_hash) return {
                    success: false,
                    e: 'unauthorized'
                };
                t.id = crypto.randomUUID();
                t.login_id = `${crypto.randomBytes(8).toHex()}DEL_${t.login_id}`;
                const res = dbm.updateEntity(t);
                if (!res) return {
                    success: false,
                    e: 'unexpected'
                };
                return {
                    success: true,
                    deleted_at: Temporal.Now.instant().epochMilliseconds
                };
            },
            
            /**
             * /api/data/userprofile
             * @method GET
             * @type {RouteFunction<'/api/data/userprofile', 'GET', [User]>}
             */
            dataUserProfileGet(data, user) {
                const {
                    id,
                    user: u,
                    nickname
                } = data;
                const t = dbm.findEntity({
                    type: 'user_profile',
                    ...removeEmpty({
                        id,
                        u,
                        nickname
                    })
                }).at(0);
                if (!t) return {
                    success: false,
                    e: 'profile_doesnt_exist'
                };
                return {
                    success: true,
                    data: {
                        id: t.id,
                        nickname: t.nickname,
                        image: t.image,
                        user: t.user
                    }
                };
            },
            
            /**
             * /api/data/userprofile
             * @method POST
             * @type {RouteFunction<'/api/data/userprofile', 'POST', [User]>}
             */
            dataUserProfilePost(data, user) {
                const { nickname, image } = data;
                /** @type {WithoutID<UserProfile>} */
                const param = {
                    type: 'user_profile',
                    user: user.id,
                    nickname,
                    image
                };
                const t = dbm.createEntity(param);
                if (!t) return {
                    success: false,
                    e: 'unexpected'
                };
                return {
                    success: true,
                    data: {
                        id: t.id,
                        image: t.image,
                        nickname: t.nickname,
                        user: t.user
                    }
                };
            },
            
            /**
             * /api/data/userprofile
             * @method PATCH
             * @type {RouteFunction<'/api/data/userprofile', 'PATCH', [User]>}
             */
            dataUserProfilePatch(data, user) {
                const {
                    id,
                    data: {
                        nickname,
                        image
                    }
                } = data;
                const t = dbm.getByID(id);
                if (
                    t?.type != 'user_profile' ||
                    t.user != user.id
                ) return {
                    success: false,
                    e: 'profile_doesnt_exist'
                };
                const modifier = removeEmpty({
                    nickname,
                    image
                });
                Object.entries(modifier).forEach(([k, v]) => t[k] = v);
                const res = dbm.updateEntity(t);
                if (!res) return {
                    success: false,
                    e: 'unexpected'
                };
                return {
                    success: true,
                    modified: getModified(res, modifier)
                };
            },
            
            /**
             * /api/data/userprofile
             * @method DELETE
             * @type {RouteFunction<'/api/data/userprofile', 'DELETE', [User]>}
             */
            dataUserProfileDelete(data, user) {
                const { id } = data;
                const t = dbm.getByID(id);
                if (
                    t?.type != 'user_profile' ||
                    t.user != user.id
                ) return {
                    success: false,
                    e: 'profile_doesnt_exist'
                };
                const res = dbm.deleteEntity(t);
                if (!res) return {
                    success: false,
                    e: 'unexpected'
                };
                return {
                    success: true
                };
            },
            
            /**
             * /api/data/professor
             * @method GET
             * @type {RouteFunction<'/api/data/professor', 'GET'>}
             */
            dataProfessorGet(data) {
                const {
                    id,
                    name,
                    tel,
                    mail
                } = data;
                const t = dbm.findEntity({
                    type: 'professor',
                    ...removeEmpty({
                        id,
                        name,
                        tel,
                        mail
                    })
                }).at(0);
                if (!t) return {
                    success: false,
                    e: 'professor_doesnt_exist'
                };
                return {
                    success: true,
                    data: {
                        name: t.name,
                        tel: t.tel,
                        mail: t.mail
                    }
                };
            },
            
            /**
             * /api/data/campus
             * @method GET
             * @type {RouteFunction<'/api/data/campus', 'GET'>}
             */
            dataCampusGet(data) {
                const {
                    id,
                    name
                } = data;
                const t = dbm.findEntity({
                    type: 'campus',
                    ...removeEmpty({
                        id,
                        name
                    })
                });
                return {
                    success: true,
                    data: t.map(({ id, name }) => ({ id, name }))
                };
            },
            
            /**
             * /api/data/college
             * @method GET
             * @type {RouteFunction<'/api/data/college', 'GET'>}
             */
            dataCollegeGet(data) {
                const {
                    id,
                    virtual,
                    code_num,
                    name,
                    campus
                } = data;
                const t = dbm.findEntity({
                    type: 'college',
                    ...removeEmpty({
                        id,
                        virtual,
                        code_num,
                        name,
                        campus
                    })
                });
                return {
                    success: true,
                    data: t.map(
                        ({ id, name, campus, code_num, virtual }) =>
                        ({ id, name, campus, code_num, virtual })
                    )
                };
            },
            
            /**
             * /api/data/department
             * @method GET
             * @type {RouteFunction<'/api/data/department', 'GET'>}
             */
            dataDepartmentGet(data) {
                const {
                    id,
                    code,
                    name,
                    college
                } = data;
                const t = dbm.findEntity({
                    type: 'department',
                    ...removeEmpty({
                        id,
                        code,
                        name,
                        college
                    })
                });
                return {
                    success: true,
                    data: t.map(
                        ({ id, name, code, college }) =>
                        ({ id, name, code, college })
                    )
                };
            },
            
            /**
             * /api/data/course
             * @method GET
             * @type {RouteFunction<'/api/data/course', 'GET'>}
             */
            dataCourseGet(data) {
                const {
                    id,
                    code,
                    name,
                    course_type,
                    department
                } = data;
                const t = dbm.findEntity({
                    type: 'course',
                    ...removeEmpty({
                        id,
                        code,
                        name,
                        course_type,
                        department
                    })
                });
                return {
                    success: true,
                    data: t.map(
                        ({ id, name, code, course_type, department }) =>
                        ({ id, name, code, course_type, department })
                    )
                };
            },
            
            /**
             * /api/data/lecture
             * @method GET
             * @type {RouteFunction<'/api/data/lecture', 'GET'>}
             */
            dataLectureGet(data) {
                const {
                    id,
                    course,
                    ay,
                    sem,
                    professor,
                    hours,
                    lab_hours,
                    credit
                } = data;
                const t = dbm.findEntity({
                    type: 'lecture',
                    ...removeEmpty({
                        id,
                        course,
                        ay,
                        sem,
                        professor,
                        hours,
                        lab_hours,
                        credit
                    })
                });
                return {
                    success: true,
                    data: t.map(
                        ({ id, course, ay, sem, professor, hours, lab_hours, credit }) =>
                        ({ id, course, ay, sem, professor, hours, lab_hours, credit })
                    )
                };
            },
            
            /**
             * /api/data/lectureclass
             * @method GET
             * @type {RouteFunction<'/api/data/lectureclass', 'GET'>}
             */
            dataLectureClassGet(data) {
                const {
                    id,
                    code,
                    lecture
                } = data;
                const t = dbm.findEntity({
                    type: 'lecture_class',
                    ...removeEmpty({
                        id,
                        code,
                        lecture
                    })
                });
                return {
                    success: true,
                    data: t.map(
                        ({ id, code, lecture, periods }) =>
                        ({ id, code, lecture, periods })
                    )
                };
            },
            
            /**
             * /api/data/building
             * @method GET
             * @type {RouteFunction<'/api/data/building', 'GET'>}
             */
            dataBuildingGet(data) {
                const {
                    id,
                    name,
                    location
                } = data;
                const t = dbm.findEntity({
                    type: 'building',
                    ...removeEmpty({
                        id,
                        name,
                        location
                    })
                });
                return {
                    success: true,
                    data: t.map(
                        ({ id, name, location }) =>
                        ({ id, name, location })
                    )
                };
            },
            
            /**
             * /api/data/classroom
             * @method GET
             * @type {RouteFunction<'/api/data/classroom', 'GET'>}
             */
            dataClassRoomGet(data) {
                const {
                    id,
                    building,
                    room
                } = data;
                const t = dbm.findEntity({
                    type: 'class_room',
                    ...removeEmpty({
                        id,
                        building,
                        room
                    })
                });
                return {
                    success: true,
                    data: t.map(
                        ({ id, building, room }) =>
                        ({ id, building, room })
                    )
                };
            },
            
            /**
             * /api/data/comment
             * @method GET
             * @type {RouteFunction<'/api/data/comment', 'GET', [User | null]>}
             */
            dataCommentGet(data, user) {
                const {
                    id,
                    post,
                    page
                } = data;
                const limit = 50;
                const t = dbm.findEntity({
                    type: 'comment',
                    ...removeEmpty({
                        id,
                        post
                    })
                }, {
                    limit,
                    offset: limit * (page?? 0)
                });
                const profiles = user?
                    dbm.findEntity({
                        type: 'user_profile',
                        user: user.id
                    }).map(({ id }) => id): [];
                return {
                    success: true,
                    data: t.filter(({ visible, author }) => visible || profiles.includes(author)).map(
                        ({ id, post, content, created_at, updated_at, visible, author }) =>
                        ({ id, post, content, created_at, updated_at, visible, author })
                    )
                };
            },
            
            /**
             * /api/data/comment
             * @method POST
             * @type {RouteFunction<'/api/data/comment', 'POST', [User]>}
             */
            dataCommentPost(data, user) {
                const {
                    post,
                    content,
                    profile,
                    visible
                } = data;
                const pf = dbm.getByID(profile);
                if (
                    pf?.type != 'user_profile' ||
                    pf.user != user.id
                ) return {
                    success: false,
                    e: 'no_permission'
                };
                const p = dbm.getByID(post);
                const profiles = user?
                    dbm.findEntity({
                        type: 'user_profile',
                        user: user.id
                    }).map(({ id }) => id): [];
                if (
                    p?.type != 'post' ||
                    !p.visible && !profiles.includes(p.author)
                ) return {
                    success: false,
                    e: 'post_doesnt_exist'
                };
                const now = Temporal.Now.instant().epochMilliseconds;
                /** @type {WithoutID<Comment>} */
                const param = {
                    type: 'comment',
                    post: p.id,
                    author: pf.id,
                    content,
                    created_at: now,
                    updated_at: now,
                    visible
                };
                const t = dbm.createEntity(param);
                if (!t) return {
                    success: false,
                    e: 'unexpected'
                };
                return {
                    success: true,
                    data: {
                        id: t.id,
                        post: t.post,
                        content: t.content,
                        author: t.author,
                        visible: t.visible,
                        created_at: t.created_at,
                        updated_at: t.updated_at
                    }
                };
            },
            
            /**
             * /api/data/comment
             * @method PATCH
             * @type {RouteFunction<'/api/data/comment', 'PATCH', [User]>}
             */
            dataCommentPatch(data, user) {
                const {
                    id,
                    data: {
                        content,
                        visible
                    }
                } = data;
                const t = dbm.getByID(id);
                if (t?.type != 'comment') return {
                    success: false,
                    e: 'comment_doesnt_exist'
                };
                const profiles = user?
                    dbm.findEntity({
                        type: 'user_profile',
                        user: user.id
                    }).map(({ id }) => id): [];
                if (!profiles.includes(t.author)) return {
                    success: false,
                    e: 'no_permission'
                };
                const modifier = removeEmpty({
                    content,
                    visible
                });
                Object.entries(modifier).forEach(([k, v]) => t[k] = v);
                const res = dbm.updateEntity(t);
                if (!res) return {
                    success: false,
                    e: 'unexpected'
                };
                return {
                    success: true,
                    modified: getModified(res, modifier)
                };
            },
            
            /**
             * /api/data/comment
             * @method DELETE
             * @type {RouteFunction<'/api/data/comment', 'DELETE', [User]>}
             */
            dataCommentDelete(data, user) {
                const { id } = data;
                const t = dbm.getByID(id);
                if (t?.type != 'comment') return {
                    success: false,
                    e: 'comment_doesnt_exist'
                };
                const profiles = user?
                    dbm.findEntity({
                        type: 'user_profile',
                        user: user.id
                    }).map(({ id }) => id): [];
                if (!profiles.includes(t.author)) return {
                    success: false,
                    e: 'comment_doesnt_exist'
                };
                const res = dbm.deleteEntity(t);
                if (!res) return {
                    success: false,
                    e: 'unexpected'
                };
                return {
                    success: true
                };
            },
            
            /**
             * /api/data/post
             * @method GET
             * @type {RouteFunction<'/api/data/post', 'GET', [User]>}
             */
            dataPostGet(data, user) {
                const {
                    id,
                    board,
                    title,
                    content,
                    page
                } = data;
                const limit = 50;
                const t = dbm.findEntity({
                    type: 'post',
                    ...removeEmpty({
                        id,
                        board,
                        title,
                        content
                    })
                }, {
                    limit,
                    offset: limit * (page?? 0)
                });
                const profiles = user?
                    dbm.findEntity({
                        type: 'user_profile',
                        user: user.id
                    }).map(({ id }) => id): [];
                return {
                    success: true,
                    data: t.filter(({ visible, author }) => visible || profiles.includes(author)).map(
                        ({ id, board, title, content, view_count, comment_count, created_at, updated_at, visible, author }) =>
                        ({ id, board, title, content, view_count, comment_count, created_at, updated_at, visible, author })
                    )
                };
            },
            
            /**
             * /api/data/post
             * @method POST
             * @type {RouteFunction<'/api/data/post', 'POST', [User]>}
             */
            dataPostPost(data, user) {
                const {
                    board,
                    title,
                    content,
                    visible,
                    profile
                } = data;
                const pf = dbm.getByID(profile);
                if (
                    pf?.type != 'user_profile' ||
                    pf.user != user.id
                ) return {
                    success: false,
                    e: 'no_permission'
                };
                const b = dbm.getByID(board);
                if (b?.type != 'board') return {
                    success: false,
                    e: 'board_doesnt_exist'
                };
                const now = Temporal.Now.instant().epochMilliseconds;
                /** @type {WithoutID<Post>} */
                const param = {
                    type: 'post',
                    board: b.id,
                    author: pf.id,
                    title,
                    content,
                    view_count: 0,
                    comment_count: 0,
                    created_at: now,
                    updated_at: now,
                    visible
                };
                const t = dbm.createEntity(param);
                if (!t) return {
                    success: false,
                    e: 'unexpected'
                };
                return {
                    success: true,
                    data: {
                        id: t.id,
                        board: t.board,
                        title: t.title,
                        content: t.content,
                        visible: t.visible,
                        author: t.author,
                        comment_count: t.comment_count,
                        created_at: t.created_at,
                        updated_at: t.updated_at,
                        view_count: t.view_count
                    }
                };
            },
            
            /**
             * /api/data/post
             * @method PATCH
             * @type {RouteFunction<'/api/data/post', 'PATCH', [User]>}
             */
            dataPostPatch(data, user) {
                const {
                    id,
                    data: {
                        title,
                        content,
                        visible
                    }
                } = data;
                const t = dbm.getByID(id);
                if (t?.type != 'post') return {
                    success: false,
                    e: 'post_doesnt_exist'
                };
                const profiles = user?
                    dbm.findEntity({
                        type: 'user_profile',
                        user: user.id
                    }).map(({ id }) => id): [];
                if (!profiles.includes(t.author)) return {
                    success: false,
                    e: 'no_permission'
                };
                const modifier = removeEmpty({
                    title,
                    content,
                    visible
                });
                Object.entries(modifier).forEach(([k, v]) => t[k] = v);
                const res = dbm.updateEntity(t);
                if (!res) return {
                    success: false,
                    e: 'unexpected'
                };
                return {
                    success: true,
                    modified: getModified(res, modifier)
                };
            },
            
            /**
             * /api/data/post
             * @method DELETE
             * @type {RouteFunction<'/api/data/post', 'DELETE', [User]>}
             */
            dataPostDelete(data, user) {
                const { id } = data;
                const t = dbm.getByID(id);
                if (t?.type != 'post') return {
                    success: false,
                    e: 'post_doesnt_exist'
                };
                const profiles = user?
                    dbm.findEntity({
                        type: 'user_profile',
                        user: user.id
                    }).map(({ id }) => id): [];
                if (!profiles.includes(t.author)) return {
                    success: false,
                    e: 'post_doesnt_exist'
                };
                const res = dbm.deleteEntity(t);
                if (!res) return {
                    success: false,
                    e: 'unexpected'
                };
                return {
                    success: true
                };
            },
            
            /**
             * /api/data/board
             * @method GET
             * @type {RouteFunction<'/api/data/board', 'GET'>}
             */
            dataBoardGet(data) {
                const {
                    id,
                    name
                } = data;
                const t = dbm.findEntity({
                    type: 'board',
                    ...removeEmpty({
                        id,
                        name
                    })
                });
                return {
                    success: true,
                    data: t.map(
                        ({ id, description, name, post_count }) =>
                        ({ id, description, name, post_count })
                    )
                };
            },
            
            /**
             * /api/data/timetable
             * @method GET
             * @type {RouteFunction<'/api/data/timetable', 'GET', [User]>}
             */
            dataTimeTableGet(data, user) {
                const {
                    id,
                    user: u,
                    page
                } = data;
                const limit = 50;
                const t = dbm.findEntity({
                    type: 'time_table',
                    ...removeEmpty({
                        id,
                        user: u
                    })
                }, {
                    limit,
                    offset: limit * (page?? 0)
                });
                return {
                    success: true,
                    data: t.filter(({ visible, user: u }) => visible || u == user.id).map(
                        ({ id, periods, name, selected, user: u, visible }) =>
                        ({ id, periods, name, selected, user: u, visible })
                    )
                };
            },
            
            /**
             * /api/data/timetable
             * @method POST
             * @type {RouteFunction<'/api/data/timetable', 'POST', [User]>}
             */
            dataTimeTablePost(data, user) {
                const {
                    name,
                    selected,
                    periods,
                    visible
                } = data;
                if (!periods.every(({ room }) =>
                    dbm.getByID(room)?.type == 'class_room'
                )) return {
                    success: false,
                    e: 'classroom_doesnt_exist'
                };
                /** @type {WithoutID<TimeTable>} */
                const param = {
                    type: 'time_table',
                    name,
                    user: user.id,
                    selected,
                    visible,
                    /** @type {any} */
                    periods
                };
                const t = dbm.createEntity(param);
                if (!t) return {
                    success: false,
                    e: 'unexpected'
                };
                return {
                    success: true,
                    data: {
                        id: t.id,
                        periods: t.periods,
                        name: t.name,
                        selected: t.selected,
                        user: t.user,
                        visible: t.visible
                    }
                };
            },
            
            /**
             * /api/data/timetable
             * @method PATCH
             * @type {RouteFunction<'/api/data/timetable', 'PATCH', [User]>}
             */
            dataTimeTablePatch(data, user) {
                const {
                    id,
                    data: {
                        name,
                        selected,
                        periods,
                        visible
                    }
                } = data;
                const t = dbm.getByID(id);
                if (
                    t?.type != 'time_table' ||
                    t.user != user.id
                ) return {
                    success: false,
                    e: 'timetable_doesnt_exist'
                };
                const modifier = removeEmpty({
                    name,
                    selected,
                    visible,
                    periods
                });
                Object.entries(modifier).forEach(([k, v]) => t[k] = v);
                const res = dbm.updateEntity(t);
                if (!res) return {
                    success: false,
                    e: 'unexpected'
                };
                return {
                    success: true,
                    modified: getModified(res, modifier)
                };
            },
            
            /**
             * /api/data/timetable
             * @method DELETE
             * @type {RouteFunction<'/api/data/timetable', 'DELETE', [User]>}
             */
            dataTimeTableDelete(data, user) {
                const { id } = data;
                const t = dbm.getByID(id);
                if (
                    t?.type != 'time_table' ||
                    t.user != user.id
                ) return {
                    success: false,
                    e: 'timetable_doesnt_exist'
                };
                const res = dbm.deleteEntity(t);
                if (!res) return {
                    success: false,
                    e: 'unexpected'
                };
                return {
                    success: true
                };
            },
            
            /**
             * /api/data/graduationprogress
             * @method GET
             * @type {RouteFunction<'/api/data/graduationprogress', 'GET', [User]>}
             */
            dataGraduationProgressGet(data, user) {
                const {
                    user: u
                } = data;
                if (u != user.id) return {
                    success: false,
                    e: 'no_permission'
                };
                const t = dbm.findEntity({
                    type: 'graduation_progress',
                    user: u
                }).at(0);
                if (!t) return {
                    success: false,
                    e: 'unexpected'
                };
                return {
                    success: true,
                    data: {
                        id: t.id,
                        color: t.color,
                        details: t.details,
                        user: t.user,
                        value: t.value
                    }
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