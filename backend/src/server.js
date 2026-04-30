/**
 * @import { RunningController } from './controller'
 */

import { CreateRunningController } from './controller.js';
import { DatabaseManager } from './database.js';
import { LoginSessionManager } from './sessions.js';
import { AppManager } from './app.js';





// ====================
// Server
// ====================

/**
 * @typedef ServerContext
 * @property {ReturnType<typeof DatabaseManager>?} databaseManager
 * @property {ReturnType<typeof LoginSessionManager>?} loginSessionManager
 * @property {ReturnType<typeof AppManager>?} appManager
 */

/**
 * @param {RunningController} rcon
 */
export function CreateServer(rcon) {
    /** @type {ServerContext} */
    const context = {
        databaseManager: null,
        loginSessionManager: null,
        appManager: null
    };
    context.databaseManager = DatabaseManager(context, CreateRunningController());
    const dbMgr = context.databaseManager;
    context.loginSessionManager = LoginSessionManager(context, CreateRunningController());
    const lsMgr = context.loginSessionManager;
    context.appManager = AppManager(context, CreateRunningController());
    const apMgr = context.appManager;
    
    return {
        controller: rcon.outer,
        
        async serve() {
            const dbCon = dbMgr.controller;
            const lsCon = lsMgr.controller;
            const apCon = apMgr.controller;
            const controller = rcon.inner;
            dbMgr.serve();
            lsMgr.serve();
            apMgr.serve();
            await Promise.all([
                dbCon.start(),
                lsCon.start(),
                apCon.start()
            ]);
            await controller.start();
            
            while (true) {
                if (dbCon.isPendingFor().stop) {
                    await dbCon.stop();
                    dbMgr.serve();
                    await dbCon.start();
                }
                if (lsCon.isPendingFor().stop) {
                    await lsCon.stop();
                    lsMgr.serve();
                    await lsCon.start();
                }
                if (apCon.isPendingFor().stop) {
                    await apCon.stop();
                    apMgr.serve();
                    await apCon.start();
                }
                await Promise.any([
                    dbCon.waitFor(false),
                    lsCon.waitFor(false),
                    apCon.waitFor(false),
                    controller.waitFor(false)
                ]);
                if (controller.isPendingFor().stop) {
                    break;
                }
            }
            
            await Promise.all([
                dbCon.stop(),
                lsCon.stop(),
                apCon.stop()
            ]);
            context.appManager = null;
            context.databaseManager = null;
            context.loginSessionManager = null;
            await controller.stop();
        }
    };
}