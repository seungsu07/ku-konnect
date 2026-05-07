/**
 * @import { Entity, WithoutID, EntityID, Session } from '../../common/models'
 * @import { RunningController, MonoController } from './controller'
 * @import { ServerContext } from './server'
 * @import { DatabaseManager } from './database'
 */

import { Temporal } from '@js-temporal/polyfill';
import { CreateRunningController } from './controller';





// ====================
// Sessions
// ====================

/** @typedef {ReturnType<typeof CreateLoginSessionManager>} LoginSessionManager */

/**
 * @param {DatabaseManager} dbManager
 * @param {RunningController} rcon
 */
export function CreateLoginSessionManager(dbManager, rcon) {
    /** @type {Map<EntityID<'session'>, Session>} */
    const sessionMap = new Map();
    /** @type {Map<EntityID<'user'>, Set<EntityID<'session'>>>} */
    const userMap = new Map();
    /** @type {EntityID<'session'>[]} */
    const garbageQueue = [];

    return {
        /** @type {MonoController} */
        controller: rcon.outer,

        /**
         * @param {EntityID<'user'>} user_id
         * @param {Temporal.Duration} duration
         */
        register(user_id, duration = Temporal.Duration.from({ days: 7 })) {
            const expires_at = Temporal.Now
                .zonedDateTimeISO()
                .add(duration)
                .epochMilliseconds;
            const session_id = crypto.randomUUID();
            /** @type {WithoutID<Session>} */
            const param = {
                type: 'session',
                data_type: 'LOGIN',
                data: user_id,
                expired: false,
                expires_at
            };
            if (!dbManager) return;
            const session = dbManager.createEntity('session', param);
            sessionMap.set(session_id, session);
            const user = userMap.get(user_id) ??
                /** @type {Set<EntityID<'session'>>} */
                (userMap.set(user_id, new Set()).get(user_id));
            user.add(session_id);
        },

        /**
         * @param {EntityID<'session' | 'user'>} id
         * @returns {EntityID<'session' | 'user'>[]}
         */
        expire(id) {
            sessionChk: {
                const session = sessionMap.get(/** @type {any} */ (id));
                if (!session) break sessionChk;
                if (session.expired) return [id];
                session.expired = true;
                garbageQueue.push(/** @type {any} */ (id));
                return [id];
            }
            userChk: {
                const user = userMap.get(/** @type {any} */ (id))
                if (!user) break userChk;
                return user.keys().flatMap(e => this.expire(e)).toArray();
            }
            return [];
        },

        /**
         * @param {Temporal.Duration} delay
         * @returns {Promise<void>}
         */
        async serve(delay = Temporal.Duration.from({ minutes: 3 })) {
            const controller = rcon.inner;
            await dbManager.controller.waitFor(true);
            await controller.start();

            function collect() {
                const gqTemp = garbageQueue.splice(0);
                gqTemp.forEach(e => {
                    const session = sessionMap.get(e);
                    if (!session || !dbManager) return;
                    dbManager.deleteEntity(session);
                    const user = userMap.get(session.data);
                    if (!user) return;
                    user.delete(e);
                });
            }

            while (true) {
                collect();
                const { promise: delay_prom, resolve } = Promise.withResolvers();
                setTimeout(resolve, delay.total('millisecond'));
                await Promise.any([delay_prom, controller.waitFor(false)]);
                if (controller.isPendingFor().stop) {
                    collect();
                    break;
                }
            }

            await controller.stop();
        }
    };
}

/** @typedef {ReturnType<typeof CreateSessionManager>} SessionManager */

/**
 * @param {ServerContext} context
 * @param {RunningController} rcon
 */
export function CreateSessionManager(context, rcon) {
    
    
    return {
        /** @type {MonoController} */
        controller: rcon.outer,
        
        /**
         * @param {Temporal.Duration} delay
         * @returns {Promise<void>}
         */
        async serve(delay = Temporal.Duration.from({ minutes: 3 })) {
            const dbManager = context.databaseManager;
            if (!dbManager) return;
            const loginMgr = CreateLoginSessionManager(dbManager, CreateRunningController());
            const loginCon = loginMgr.controller;
            const controller = rcon.inner;
            loginMgr.serve();
            await Promise.all([
                loginCon.start(),
                dbManager.controller.waitFor(true)
            ]);
            await controller.start();

            while (true) {
                if (loginCon.isPendingFor().stop) {
                    await loginCon.stop();
                    loginMgr.serve();
                    await loginCon.start();
                }
                
                const { promise: delay_prom, resolve } = Promise.withResolvers();
                setTimeout(resolve, delay.total('millisecond'));
                await Promise.any([
                    delay_prom,
                    loginCon.waitFor(false),
                    controller.waitFor(false)
                ]);
                if (controller.isPendingFor().stop) {
                    break;
                }
            }
    
            await Promise.all([
                loginCon.stop()
            ]);
            await controller.stop();
        }
    }
}