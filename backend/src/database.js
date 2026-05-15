/**
 * @import { TypeEntity, Entity, EntityType, EntityID, SolvedNestedID, WithoutID, User, Campus, Department, College, Session, UserProfile, Professor, BoolRecord, Comment, Post, TimeTable, Period, GraduationProgress, Board, StudyGroup } from '../../common/models.js'
 * @import { RouteFunction } from '../../common/dto.js'
 * @import { RunningController, MonoController } from './controller.js'
 * @import { ServerContext } from './server.js'
 */

import loki from 'lokijs';
import nodemailer from 'nodemailer';
import socks from 'socks';
import { Temporal } from '@js-temporal/polyfill';
import crypto from 'node:crypto';
import JSON_CAMPUSES from '../data/campuses.json' with { type: 'json' };
import JSON_COLLEGES from '../data/colleges.json' with { type: 'json' };
import JSON_DEPARTMENTS from '../data/departments.json' with { type: 'json' };
import JSON_BUILDINGS from '../data/buildings.json' with { type: 'json' };
import JSON_CLASSROOMS from '../data/classroom.json' with { type: 'json' };
import JSON_COURSES from '../data/courses.json' with { type: 'json' };
import JSON_LECTURES from '../data/lectures.json' with { type: 'json' };
import JSON_LECTURECLASSES from '../data/lectureclasses.json' with { type: 'json' };
import JSON_PROFESSORS from '../data/professors.json' with { type: 'json' };
import JSON_BOARDS from '../data/boards.json' with { type: 'json' };





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

const SEND_LIMIT = 100;
const SEND_MIN_DURATION = Temporal.Duration.from({ minutes: 1 });
const SEND_LIMIT_DURATION = Temporal.Duration.from({ hours: 12 });
/** @type {Temporal.Instant[]} */
const mail_sended = [];

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
    }).then(() => {
        mail_sended.push(Temporal.Now.instant());
        if (mail_sended.length > 100) {
            mail_sended.splice(0, mail_sended.length - 100);
        }
        return true;
    }).catch((e) => (console.error(e), false));
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
            <h1 style="border-bottom: 1px solid #000000;">${title}</h1>
            ${content}
        </body>
    </html>
    `;
}

// ====================





// ====================
// Database
// ====================

/** @type {PromiseWithResolvers<void>} */
const { promise: dbWait, resolve: dbOk } = Promise.withResolvers();

const db = new loki('./database.json', {
    autoload: true,
    autoloadCallback: () => {
        dbOk();
        console.log('Database loaded');
    },
    autosave: true,
    autosaveInterval: 60000,
    autosaveCallback: () => {
        console.log('Database saved');
    },
    env: 'NODEJS'
});

/** @type {EntityID<'board'>} */
const STUDY_GROUP_DESCRIPTIONS = '709d1bed-6f52-4584-8ad6-0c8c92ea4772';

/**
 * @template {(...args: any[]) => any} T
 * @typedef {(...args: Parameters<T>) => Promise<ReturnType<Awaited<T>>>} Asyncify
 */

/** @typedef {ReturnType<typeof CreateDatabaseManager>} DatabaseManager */

/**
 * @param {ServerContext} context
 * @param {RunningController} rcon
 */
export function CreateDatabaseManager(context, rcon) {

    /** @type {Collection<Entity<EntityType>>?} */
    let collection = null;
    
    (async () => {
        await dbWait;
        collection = db.getCollection('entities') ??
        (() => {
            const col = db.addCollection('entities', { unique: ['id'], indices: ['type'] });
            col.insert(JSON_CAMPUSES);
            col.insert(JSON_COLLEGES);
            col.insert(JSON_DEPARTMENTS);
            col.insert(JSON_BUILDINGS);
            col.insert(JSON_CLASSROOMS);
            col.insert(JSON_COURSES);
            col.insert(JSON_LECTURES);
            col.insert(JSON_LECTURECLASSES);
            col.insert(JSON_PROFESSORS);
            col.insert(JSON_BOARDS);
            console.log('Created collection');
            return col;
        })();
    })();
    
    /** @type {ServerContext['sessionManager']} */
    let sessionManager;
    
    /**
     * @param {string} password
     * @param {string} salt
     */
    function makehash(password, salt=crypto.randomBytes(8).toString('hex')) {
        const iterations = 100000;
        const keylen = 64;
        const digest = 'sha512';
        return {
            hash: crypto
                .pbkdf2Sync(password, salt, iterations, keylen, digest)
                .toString('hex'),
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
            db,
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
        
        collectIDMap() {
            idMap.forEach((v, k) => v.deref() == undefined? idMap.delete(k): undefined);
        },
        
        /**
         * @template {TypeEntity<EntityType>} T
         * @param {WithoutID<T>} param
         * @returns {T | undefined}
         */
        createEntity(param) {
            if (!collection) throw new Error();
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
            if (!collection) throw new Error();
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
            if (!collection) throw new Error();
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
            if (!collection) throw new Error();
            const result = collection.update(entity);
            return /** @type {any} */ (result);
        },
        
        /**
         * @template {TypeEntity<EntityType>} T
         * @param {T} entity
         * @returns {T | undefined}
         */
        deleteEntity(entity) {
            if (!collection) throw new Error();
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
                if (dbm.findEntity({ type: 'user', univ_mail: address })) return {
                    success: false,
                    e: 'used_mail'
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
                    deleted: false
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
                dbm.createEntity(gparam);
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
                if (user.deleted) return {
                    success: false,
                    e: 'user_doesnt_exist'
                };
                const { hash } = makehash(password, user.login_salt);
                if (user.login_hash != hash) return {
                    success: false,
                    e: 'user_doesnt_exist'
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
                const prev = mailMgr.checkVerify(address);
                if (
                    prev.valid &&
                    prev.limit >= Temporal.Duration.from({ minutes: 5 }).total('milliseconds')
                ) return {
                    success: false,
                    e: 'already_processed'
                };
                if (
                    mail_sended.length >= 100 &&
                    Temporal.Now.instant()
                        .since(/** @type {any} */ (mail_sended.at(-100)))
                        .subtract(SEND_LIMIT_DURATION).sign < 0 ||
                    mail_sended.length != 0 &&
                    Temporal.Now.instant()
                        .since(/** @type {any} */ (mail_sended.at(-1)))
                        .subtract(SEND_MIN_DURATION).sign < 0
                ) return {
                    success: false,
                    e: 'server_is_busy'
                };
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
             * /api/auth/verify/studygroup
             * @method GET
             * @type {RouteFunction<'/api/auth/verify/studygroup', 'GET', [User]>}
             */
            verifyStudyGroupGet(data, user) {
                const {
                    group,
                    profile
                } = data;
                const pf = dbm.getByID(profile);
                if (
                    pf?.type != 'user_profile' ||
                    pf.user != user?.id
                ) return {
                    success: false,
                    e: 'no_permission'
                };
                const t = dbm.getByID(group);
                if (
                    t?.type != 'study_group'
                ) return {
                    success: false,
                    e: 'studygroup_doesnt_exist'
                };
                if (
                    t.pendings.includes(pf.id) ||
                    t.users.includes(pf.id)
                ) return {
                    success: false,
                    e: 'already_processed'
                };
                t.pendings.push(pf.id);
                const res = dbm.updateEntity(t);
                if (!res) return {
                    success: false,
                    e: 'unexpected'
                };
                return {
                    success: true
                };
            },
            
            /**
             * /api/auth/verify/studygroup
             * @method POST
             * @type {RouteFunction<'/api/auth/verify/studygroup', 'POST', [User]>}
             */
            verifyStudyGroupPost(data, user) {
                const {
                    group,
                    code,
                    profile
                } = data;
                const pf = dbm.getByID(profile);
                if (
                    pf?.type != 'user_profile' ||
                    pf.user != user?.id
                ) return {
                    success: false,
                    e: 'no_permission'
                };
                const t = dbm.getByID(group);
                if (
                    t?.type != 'study_group' ||
                    !t.pendings.includes(pf.id)
                ) return {
                    success: false,
                    e: 'studygroup_doesnt_exist'
                };
                if (t.verify_code != code) return {
                    success: false,
                    e: 'code_doesnt_match'
                };
                t.pendings = t.pendings.filter(u => u != pf.id);
                t.users.push(pf.id);
                const res = dbm.updateEntity(t);
                if (!res) return {
                    success: false,
                    e: 'unexpected'
                };
                return {
                    success: true
                };
            },
            
            /**
             * /api/auth/verify/tel
             * @method GET
             * @type {RouteFunction<'/api/auth/verify/tel', 'GET'>}
             */
            // verifyTelGet(data) {
            //     
            //     return;
            // },
            
            /**
             * /api/auth/verify/tel
             * @method GET
             * @type {RouteFunction<'/api/auth/verify/tel', 'POST'>}
             */
            // verifyTelPost(data) {
            //     
            //     return;
            // },
            
            /**
             * /api/data/user
             * @method GET
             * @type {RouteFunction<'/api/data/user', 'GET', [User]>}
             */
            dataUserGet(_, user) {
                const t = dbm.getByID(user.id);
                if (!t) return {
                    success: false,
                    e: 'unexpected'
                };
                return {
                    success: true,
                    data: [{
                        id: t.id,
                        login_id: t.login_id,
                        name: t.name,
                        student_id: t.student_id,
                        campus: t.campus,
                        college: t.college,
                        department: t.department,
                        univ_mail: t.univ_mail,
                        mail: t.univ_mail
                    }]
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
                t.deleted = true;
                const res = dbm.updateEntity(t);
                if (!res) return {
                    success: false,
                    e: 'unexpected'
                };
                const sessions = dbm.findEntity({
                    type: 'session',
                    data_type: 'LOGIN',
                    data: t.id
                });
                for (const s of sessions) {
                    try {
                        dbm.deleteEntity(s);
                    } catch (e) {
                        console.error(e);
                    }
                }
                return {
                    success: true,
                    deleted_at: Temporal.Now.instant().epochMilliseconds
                };
            },
            
            /**
             * /api/data/userprofile
             * @method GET
             * @type {RouteFunction<'/api/data/userprofile', 'GET'>}
             */
            dataUserProfileGet(data) {
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
                });
                return {
                    success: true,
                    data: t.map(({ id, nickname, image, user }) =>
                        ({ id, nickname, image, user }))
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
                });
                return {
                    success: true,
                    data: t.map(({ id, name, tel, mail }) =>
                        ({ id, name, tel, mail }))
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
                        code: code? {
                            '$regex': new RegExp(RegExp.escape(code))
                        }: undefined,
                        name: name? {
                            '$regex': new RegExp(RegExp.escape(name))
                        }: undefined,
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
             * @type {RouteFunction<'/api/data/comment', 'POST', [User | null]>}
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
                    pf.user != user?.id
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
                p.comment_count++;
                dbm.updateEntity(p);
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
                const post = dbm.getByID(t.post);
                if (post) {
                    post.comment_count--;
                    dbm.updateEntity(post);
                }
                return {
                    success: true
                };
            },
            
            /**
             * /api/data/post
             * @method GET
             * @type {RouteFunction<'/api/data/post', 'GET', [User | null]>}
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
                        title: title? {
                            '$regex': new RegExp(RegExp.escape(title))
                        }: undefined,
                        content: content? {
                            '$regex': new RegExp(RegExp.escape(content))
                        }: undefined,
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
                b.post_count++;
                dbm.updateEntity(b);
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
                const board = dbm.getByID(t.board);
                if (board) {
                    board.post_count--;
                    dbm.updateEntity(board);
                }
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
             * @type {RouteFunction<'/api/data/timetable', 'GET', [User | null]>}
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
                    data: t.filter(({ visible, user: u }) => visible || u == user?.id).map(
                        ({ id, classes, name, selected, user: u, visible }) =>
                        ({ id, classes, name, selected, user: u, visible })
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
                    classes,
                    visible
                } = data;
                if (!classes.every(c =>
                    dbm.getByID(c)?.type == 'lecture_class'
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
                    classes
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
                        classes: t.classes,
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
                        classes,
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
                    classes
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
                });
                return {
                    success: true,
                    data: t.map(({ id, color, details, user, value }) =>
                        ({ id, color, details, user, value }))
                };
            },
            
            /**
             * /api/data/graduationprogress
             * @method PATCH
             * @type {RouteFunction<'/api/data/graduationprogress', 'PATCH', [User]>}
             */
            dataGraduationProgressPatch(data, user) {
                const {
                    id,
                    data: {
                        color,
                        details
                    }
                } = data;
                const t = dbm.getByID(id);
                if (
                    t?.type != 'graduation_progress' ||
                    t.user != user.id
                ) return {
                    success: false,
                    e: 'graduationprogress_doesnt_exist'
                };
                const modifier = removeEmpty({
                    color,
                    details
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
             * /api/auth/verify/studygroup
             * @method POST
             * @type {RouteFunction<'/api/auth/verify/studygroup', 'POST', [User]>}
             */
            authVerifyStudyGroup(data, user) {
                const {
                    group,
                    code,
                    profile
                } = data;
                const pf = dbm.getByID(profile);
                if (
                    pf?.type != 'user_profile' ||
                    pf.user != user.id
                ) return {
                    success: false,
                    e: 'profile_doesnt_exist'
                };
                const t = dbm.getByID(group);
                if (
                    t?.type != 'study_group' ||
                    !t.pendings.includes(pf.id) ||
                    !t.inviting ||
                    t.verify_code != code
                ) return {
                    success: false,
                    e: 'studygroup_doesnt_exist'
                };
                t.pendings = t.pendings.filter(e => e != pf.id);
                t.users.push(pf.id);
                const res = dbm.updateEntity(t);
                if (!res) return {
                    success: false,
                    e: 'unexpected'
                };
                return {
                    success: true
                };
            },
            
            /**
             * /api/session
             * @method DELETE
             * @type {RouteFunction<'/api/session', 'DELETE', [Session | null]>}
             */
            sessionDelete(_, session) {
                if (!session) return {
                    success: false,
                    e: 'unauthorized'
                };
                session.expired = true;
                const res = dbm.updateEntity(session);
                if (!res) return {
                    success: false,
                    e: 'unexpected'
                };
                return {
                    success: true
                };
            },
            
            /**
             * /api/data/studygroup
             * @method GET
             * @type {RouteFunction<'/api/data/studygroup', 'GET', [User | null]>}
             */
            dataStudyGroupGet(data, user) {
                const {
                    id,
                    name,
                    post,
                    inviting,
                    page
                } = data;
                const limit = 50;
                const t = dbm.findEntity({
                    type: 'study_group',
                    ...removeEmpty({
                        id,
                        name,
                        post,
                        inviting
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
                    data: t.map(g => {
                        const ish = profiles.includes(g.host);
                        const inu = g.users.findIndex(u => profiles.includes(u)) != -1;
                        const inp = g.pendings.findIndex(u => profiles.includes(u)) != -1;
                        return { ...g, inu, inp, ish };
                    })
                    .filter(g => g.visible || g.inp || g.inu || g.ish)
                    .map(({ id, name, user_visible, inviting, visible, post, users, pendings, host, chat, verify_code, inu, inp, ish }) =>
                        ({
                            id, name, user_visible, inviting, visible,
                            post: visible || inu || ish? post: undefined,
                            users: (visible && user_visible) || inu || ish? users: undefined,
                            pendings: ish? pendings: undefined,
                            host,
                            chat: inu? chat: undefined,
                            verify_code: ish? verify_code: undefined
                        })
                    )
                };
            },
            
            /**
             * /api/data/studygroup
             * @method POST
             * @type {RouteFunction<'/api/data/studygroup', 'POST', [User]>}
             */
            dataStudyGroupPost(data, user) {
                const {
                    name,
                    user_visible,
                    inviting,
                    visible,
                    description,
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
                const now = Temporal.Now.instant().epochMilliseconds;
                /** @type {WithoutID<Post>} */
                const pp = {
                    type: 'post',
                    board: STUDY_GROUP_DESCRIPTIONS,
                    visible,
                    title: name,
                    content: description,
                    author: pf.id,
                    created_at: now,
                    updated_at: now,
                    view_count: 0,
                    comment_count: 0
                };
                const pr = dbm.createEntity(pp);
                if (!pr) return {
                    success: false,
                    e: 'unexpected'
                };
                /** @type {WithoutID<Board>} */
                const bp = {
                    type: 'board',
                    name: `__CHAT_${name}__`,
                    description: '',
                    post_count: 0
                };
                const br = dbm.createEntity(bp);
                if (!br) return {
                    success: false,
                    e: 'unexpected'
                };
                /** @type {WithoutID<StudyGroup>} */
                const param = {
                    type: 'study_group',
                    name,
                    post: pr.id,
                    users: [pf.id],
                    pendings: [],
                    user_visible,
                    inviting,
                    host: pf.id,
                    chat: br.id,
                    verify_code: String(Math.round(Math.random() * 1000000)).padStart(6, '0'),
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
                        name: t.name,
                        post: t.post,
                        users: t.users,
                        pendings: t.pendings,
                        user_visible: t.user_visible,
                        inviting: t.inviting,
                        host: t.host,
                        chat: t.chat,
                        verify_code: t.verify_code,
                        visible: t.visible
                    }
                };
            },
            
            /**
             * /api/data/studygroup
             * @method PATCH
             * @type {RouteFunction<'/api/data/studygroup', 'PATCH', [User]>}
             */
            dataStudyGroupPatch(data, user) {
                const {
                    id,
                    data: {
                        name,
                        users,
                        pendings,
                        user_visible,
                        inviting,
                        host,
                        visible
                    }
                } = data;
                const t = dbm.getByID(id);
                if (
                    t?.type != 'study_group'
                ) return {
                    success: false,
                    e: 'studygroup_doesnt_exist'
                };
                const profiles = user?
                    dbm.findEntity({
                        type: 'user_profile',
                        user: user.id
                    }).map(({ id }) => id): [];
                const ish = profiles.includes(t.host);
                const modifier = removeEmpty({
                    user_visible: ish? user_visible: undefined,
                    inviting: ish? inviting: undefined,
                    host: ish && t.users.includes(/** @type {any} */ (host))? host: undefined,
                    visible: ish? visible: undefined
                });
                if (name) ifb: {
                    if (!ish) break ifb;
                    modifier['name'] = name;
                }
                if (users) {
                    const org = new Set(t.users);
                    const rm = new Set(
                        t.users.filter(u => !users.includes(u))
                            .filter(u => ish || profiles.includes(u))
                    );
                    const after = org.difference(rm);
                    modifier['users'] = Array.from(after);
                }
                if (pendings) {
                    const org = new Set(t.pendings);
                    const rm = new Set(
                        t.pendings.filter(u => !pendings.includes(u))
                            .filter(u => ish || profiles.includes(u))
                    );
                    const after = org.difference(rm);
                    modifier['pendings'] = Array.from(after);
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
             * /api/data/studygroup
             * @method DELETE
             * @type {RouteFunction<'/api/data/studygroup', 'DELETE', [User]>}
             */
            dataStudyGroupDelete(data, user) {
                const { id } = data;
                const t = dbm.getByID(id);
                const profiles = user?
                    dbm.findEntity({
                        type: 'user_profile',
                        user: user.id
                    }).map(({ id }) => id): [];
                if (
                    t?.type != 'study_group' ||
                    !profiles.includes(t.host)
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
            }
        },

        /**
         * @returns {Promise<void>}
         */
        async serve(delay = Temporal.Duration.from({ minutes: 3 })) {
            await dbWait;
            sessionManager = context.sessionManager;
            if (!sessionManager) throw new Error();
            const controller = rcon.inner;
            await controller.start();

            while (true) {
                const { promise: db_save, resolve: db_save_resv } = Promise.withResolvers();
                db.save(db_save_resv);
                const err = await db_save;
                if (err) console.error(err);
                this.collectIDMap();
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