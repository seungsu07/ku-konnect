/**
 * @import { RunningController } from './controller'
 * @import { DatabaseManager } from './database'
 * @import { SessionManager } from './sessions'
 * @import { AppManager } from './app'
 */

import { CreateRunningController } from './controller.js';
import { CreateDatabaseManager } from './database.js';
import { CreateSessionManager } from './sessions.js';
import { CreateAppManager } from './app.js';





// ====================
// Server
// ====================

/**
 * @typedef ServerContext
 * @property {DatabaseManager?} databaseManager
 * @property {SessionManager?} loginSessionManager
 * @property {AppManager?} appManager
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
    
    return {
        controller: rcon.outer,
        
        async serve() {
            const dbMgr = CreateDatabaseManager(context, CreateRunningController());
            const lsMgr = CreateSessionManager(context, CreateRunningController());
            const apMgr = CreateAppManager(context, CreateRunningController());
            const dbCon = dbMgr.controller;
            const lsCon = lsMgr.controller;
            const apCon = apMgr.controller;
            const controller = rcon.inner;
            context.databaseManager = dbMgr;
            context.loginSessionManager = lsMgr;
            context.appManager = apMgr;
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