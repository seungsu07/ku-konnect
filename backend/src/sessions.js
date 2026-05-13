/**
 * @import { WithoutID, EntityID, Session, EntityType } from '../../common/models'
 * @import { RunningController, MonoController } from './controller'
 * @import { ServerContext } from './server'
 * @import { DatabaseManager } from './database.js'
 */

import { Temporal } from '@js-temporal/polyfill';
import { CreateRunningController } from './controller.js';





// ====================
// Sessions
// ====================

/** @typedef {ReturnType<typeof CreateLoginSessionManager>} LoginSessionManager */

/**
 * @param {SessionContext} context
 * @param {RunningController} rcon
 */
export function CreateLoginSessionManager(context, rcon) {
    /** @type {SessionContext['dbManager']} */
    let dbManager;
    
    return {
        /** @type {MonoController} */
        controller: rcon.outer,

        /**
         * @param {EntityID<EntityType>} user_id
         * @param {Temporal.Duration} duration
         * @returns {{ token: EntityID<'session'>; expires_at: number }?}
         */
        register(user_id, duration = Temporal.Duration.from({ days: 7 })) {
            dbManager = context.dbManager;
            if (!dbManager) throw new Error();
            if (dbManager.getByID(user_id)?.type != 'user') return null;
            const expires_at = Temporal.Now
                .zonedDateTimeISO()
                .add(duration)
                .epochMilliseconds;
            /** @type {WithoutID<Session>} */
            const param = {
                type: 'session',
                data_type: 'LOGIN',
                data: user_id,
                expired: false,
                expires_at
            };
            const session = dbManager.createEntity(param);
            if (!session) return null;
            return { token: session.id, expires_at };
        },
        
        /**
         * @param {EntityID<EntityType>} token
         * @param {EntityID<EntityType> | undefined} user_id
         * @returns {{ valid: false; } | { valid: true; limit: number; token: EntityID<'session'>, user_id: EntityID<'user'> }}
         */
        check(token, user_id=undefined) {
            if (!dbManager) throw new Error();
            if (!user_id || dbManager.getByID(user_id)?.type != 'user')
                return { valid: false };
            const session = dbManager.getByID(token);
            if (
                session?.type != 'session' ||
                session.expired ||
                session.data_type != 'LOGIN' ||
                session.data != (user_id ?? session.data)
            ) return { valid: false };
            const now = Temporal.Now.instant().epochMilliseconds;
            if (session.expires_at < now) {
                session.expired = true;
                dbManager.updateEntity(session);
            }
            return {
                valid: true,
                limit: session.expired? -1: session.expires_at - now,
                token: session.id,
                user_id: session.data
            };
        },

        /**
         * @param {EntityID<EntityType>} token
         * @returns {void}
         */
        expire(token) {
            if (!dbManager) throw new Error();
            const session = dbManager.getByID(token);
            if (
                session?.type != 'session' ||
                session.expired ||
                session.data_type != 'LOGIN'
            ) return;
            session.expired = true;
            dbManager.updateEntity(session);
        },

        /**
         * @param {Temporal.Duration} delay
         * @returns {Promise<void>}
         */
        async serve(delay = Temporal.Duration.from({ minutes: 3 })) {
            dbManager = context.dbManager;
            if (!dbManager) throw new Error();
            const controller = rcon.inner;
            await dbManager.controller.waitFor(true);
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

/** @typedef {ReturnType<typeof CreateMailSessionManager>} MailSessionManager */

/**
 * @param {SessionContext} context
 * @param {RunningController} rcon
 */
export function CreateMailSessionManager(context, rcon) {
    /** @type {SessionContext['dbManager']} */
    let dbManager;
    
    return {
        /** @type {MonoController} */
        controller: rcon.outer,

        /**
         * @param {string} address
         * @param {Temporal.Duration} duration
         * @returns {{ code: string, expires_at: number; }?}
         */
        registerVerify(address, duration = Temporal.Duration.from({ minutes: 5 })) {
            if (!dbManager) throw new Error();
            const expires_at = Temporal.Now
                .zonedDateTimeISO()
                .add(duration)
                .epochMilliseconds;
            const code = Math.round(Math.random() * 1000000).toString();
            /** @type {WithoutID<Session>} */
            const param = {
                type: 'session',
                data_type: 'MAIL_VERIFY',
                data: {
                    address,
                    code
                },
                expired: false,
                expires_at
            };
            const session = dbManager.createEntity(param);
            if (!session) return null;
            return { code, expires_at };
        },
        
        /**
         * @param {string} address
         * @param {Temporal.Duration} duration
         * @returns {{ token: EntityID<'session'>; expires_at: number; }?}
         */
        register(address, duration = Temporal.Duration.from({ hours: 1 })) {
            if (!dbManager) throw new Error();
            const expires_at = Temporal.Now
                .zonedDateTimeISO()
                .add(duration)
                .epochMilliseconds;
            /** @type {WithoutID<Session>} */
            const param = {
                type: 'session',
                data_type: 'MAIL',
                data: address,
                expired: false,
                expires_at
            };
            const session = dbManager.createEntity(param);
            if (!session) return null;
            return { token: session.id, expires_at };
        },
        
        /**
         * @param {string} address
         * @returns {{ valid: false; } | { valid: true; limit: number; code: string }}
         */
        checkVerify(address) {
            if (!dbManager) throw new Error();
            const code = String(Math.floor(Math.random() * 1000000));
            const session = dbManager.findEntity({
                type: 'session',
                data_type: 'MAIL_VERIFY',
                expired: false,
                'data.address': address
            }).at(0);
            if (
                !session ||
                session.expired ||
                session.data_type != 'MAIL_VERIFY' ||
                session.data.address != address
            ) return { valid: false };
            const now = Temporal.Now.instant().epochMilliseconds;
            if (session.expires_at < now) {
                session.expired = true;
                dbManager.updateEntity(session);
            }
            return {
                valid: true,
                limit: session.expired? -1: session.expires_at - now,
                code: session.data.code
            };
        },
        
        /**
         * @param {EntityID<EntityType>} token
         * @param {string | undefined} address
         * @returns {{ valid: false; } | { valid: true; limit: number; token: EntityID<'session'>; address: string; }}
         */
        check(token, address) {
            if (!dbManager) throw new Error();
            const session = dbManager.getByID(token);
            if (
                session?.type != 'session' ||
                session.expired ||
                session.data_type != 'MAIL_VERIFY' ||
                session.data != (address ?? session.data)
            ) return { valid: false };
            const now = Temporal.Now.instant().epochMilliseconds;
            if (session.expires_at < now) {
                session.expired = true;
                dbManager.updateEntity(session);
            }
            return {
                valid: true,
                limit: session.expired? -1: session.expires_at - now,
                token: session.id,
                address: session.data
            };
        },
        
        /**
         * @param {string} address
         * @returns {void}
         */
        expireVerify(address) {
            if (!dbManager) throw new Error();
            const session = dbManager.findEntity({
                type: 'session',
                data_type: 'MAIL_VERIFY',
                expired: false,
                'data.address': address
            }).at(0);
            if (
                !session ||
                session.expired
            ) return;
            session.expired = true;
            dbManager.updateEntity(session);
        },

        /**
         * @param {EntityID<EntityType>} token
         * @returns {void}
         */
        expire(token) {
            if (!dbManager) throw new Error();
            const session = dbManager.getByID(token);
            if (
                session?.type != 'session' ||
                session.expired ||
                session.data_type != 'MAIL'
            ) return;
            session.expired = true;
            dbManager.updateEntity(session);
        },

        /**
         * @param {Temporal.Duration} delay
         * @returns {Promise<void>}
         */
        async serve(delay = Temporal.Duration.from({ minutes: 3 })) {
            dbManager = context.dbManager;
            if (!dbManager) throw new Error();
            const controller = rcon.inner;
            await dbManager.controller.waitFor(true);
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

/** @typedef {ReturnType<typeof CreateSessionManager>} SessionManager */

/**
 * @typedef SessionContext
 * @property {LoginSessionManager?} loginSessionManager
 * @property {MailSessionManager?} mailSessionManager
 * @property {DatabaseManager?} dbManager
 */

/**
 * @param {ServerContext} context
 * @param {RunningController} rcon
 */
export function CreateSessionManager(context, rcon) {
    /** @type {SessionContext} */
    const sessionContext = {
        loginSessionManager: null,
        mailSessionManager: null,
        dbManager: null
    };
    
    let dbManager;
    
    return {
        /** @type {MonoController} */
        controller: rcon.outer,
        context: sessionContext,
        
        collect() {}, // TODO
        
        /**
         * @param {Temporal.Duration} delay
         * @returns {Promise<void>}
         */
        async serve(delay = Temporal.Duration.from({ minutes: 3 })) {
            dbManager = context.databaseManager;
            if (!dbManager) throw new Error();
            sessionContext.dbManager = dbManager;
            const loginMgr = CreateLoginSessionManager(sessionContext, CreateRunningController());
            const mailMgr = CreateMailSessionManager(sessionContext, CreateRunningController());
            const loginCon = loginMgr.controller;
            const mailCon = mailMgr.controller;
            const controller = rcon.inner;
            sessionContext.loginSessionManager = loginMgr;
            sessionContext.mailSessionManager = mailMgr;
            loginMgr.serve();
            mailMgr.serve();
            await Promise.all([
                loginCon.start(),
                mailCon.start(),
                dbManager.controller.waitFor(true)
            ]);
            await controller.start();

            while (true) {
                if (loginCon.isPendingFor().stop) {
                    await loginCon.stop();
                    loginMgr.serve();
                    await loginCon.start();
                }
                if (mailCon.isPendingFor().stop) {
                    await mailCon.stop();
                    mailMgr.serve();
                    await mailCon.start();
                }
                
                const { promise: delay_prom, resolve } = Promise.withResolvers();
                setTimeout(resolve, delay.total('millisecond'));
                await Promise.any([
                    delay_prom,
                    loginCon.waitFor(false),
                    mailCon.waitFor(false),
                    controller.waitFor(false)
                ]);
                if (controller.isPendingFor().stop) {
                    break;
                }
            }
    
            await Promise.all([
                loginCon.stop(),
                mailCon.stop()
            ]);
            await controller.stop();
        }
    }
}