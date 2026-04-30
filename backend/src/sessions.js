/**
 * @import { Session, SessionID, UserID } from '../../common/models'
 * @import { RunningController, MonoController } from './controller'
 * @import { ServerContext } from './server'
 */

import { Temporal } from '@js-temporal/polyfill';





// ====================
// Sessions
// ====================

/**
 * @typedef {Session & { type: 'LOGIN' }} LoginSession
 */

/**
 * @param {ServerContext} context
 * @param {RunningController} rcon
 */

export function LoginSessionManager(context, rcon) {
    /** @type {Map<SessionID, LoginSession>} */
    const sessionMap = new Map();
    /** @type {Map<UserID, Set<SessionID>>} */
    const userMap = new Map();
    /** @type {SessionID[]} */
    const registerQueue = [];
    /** @type {SessionID[]} */
    const garbageQueue = [];
    
    function collect() {}
    
    return {
        /** @type {MonoController} */
        controller: rcon.outer,
        
        /**
         * @param {UserID} user_id
         * @param {Temporal.Duration} duration
         */
        register(user_id, duration=Temporal.Duration.from({ days: 7 })) {
            const expires_at = Temporal.Now
                .zonedDateTimeISO()
                .add(duration)
                .epochMilliseconds;
            const session_id = crypto.randomUUID();
            /** @type {LoginSession} */
            const session = {
                id: session_id,
                user_id,
                type: 'LOGIN',
                expired: false,
                expires_at
            };
            sessionMap.set(session_id, session);
            const user = userMap.getOrInsert(user_id, new Set());
            user.add(session_id);
            registerQueue.push(session_id);
        },
        
        /**
         * @param {SessionID | UserID} id
         * @returns {(SessionID | UserID)[]}
         */
        expire(id) {
            sessionChk: {
                const session = sessionMap.get(id);
                if (!session) break sessionChk;
                if (session.expired) return [id];
                session.expired = true;
                garbageQueue.push(id);
                return [id];
            }
            userChk: {
                const user = userMap.get(id)
                if (!user) break userChk;
                return user.keys().flatMap(e => this.expire(e)).toArray();
            }
            return [];
        },
        
        /**
         * @param {Temporal.Duration} delay
         * @returns {Promise<void>}
         */
        async serve(delay=Temporal.Duration.from({ minutes: 3 })) {
            if (!context.databaseManager) return;
            const dbManager = context.databaseManager;
            const controller = rcon.inner;
            await dbManager.controller.waitFor(true);
            await controller.start();
            
            function collect() {
                const rqTemp = registerQueue.splice(0);
                rqTemp.forEach(e => {
                    const session = sessionMap.get(e);
                    if (!session) return;
                    if (session.expired) return;
                    dbManager.createSession(session);
                });
                const gqTemp = garbageQueue.splice(0);
                gqTemp.forEach(e => {
                    dbManager.deleteSession(e);
                    const session = sessionMap.get(e);
                    if (!session) return;
                    const user = userMap.get(session.user_id);
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