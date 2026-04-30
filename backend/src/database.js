/**
 * @import { Session, SessionID } from '../../common/models'
 * @import { RunningController, MonoController } from './controller'
 * @import { ServerContext } from './server'
 */

import { Temporal } from '@js-temporal/polyfill';





// ====================
// Database
// ====================

/**
 * @param {ServerContext} context
 * @param {RunningController} rcon
 */

export function DatabaseManager(context, rcon) {
    
    
    return {
        /** @type {MonoController} */
        controller: rcon.outer,
        
        /**
         * @param {Session} session
         * @returns {boolean}
         */
        createSession(session) {
            
            return true;
        },
        
        /**
         * @returns {Session}
         */
        getSession() {
            
            return {
                id: 'd-u-m-m-y',
                user_id: 'd-u-m-m-y',
                expired: false,
                expires_at: 0
            };
        },
        
        /**
         * @param {SessionID} id
         * @returns {boolean}
         */
        deleteSession(id) {
            
            return false;
        },
        
        /**
         * @returns {Promise<void>}
         */
        async serve(delay=Temporal.Duration.from({ minutes: 3 })) {
            const controller = rcon.inner;
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