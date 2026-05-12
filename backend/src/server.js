/**
 * @import { RunningController } from './controller'
 * @import { DatabaseManager } from './database.js'
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
 * @property {SessionManager?} sessionManager
 * @property {AppManager?} appManager
 */

/**
 * @param {RunningController} rcon
 */
export function CreateServer(rcon) {
    /** @type {ServerContext} */
    const context = {
        databaseManager: null,
        sessionManager: null,
        appManager: null
    };
    
    return {
        controller: rcon.outer,
        context,
        
        async serve() {
            const dbMgr = CreateDatabaseManager(context, CreateRunningController());
            const ssMgr = CreateSessionManager(context, CreateRunningController());
            const apMgr = CreateAppManager(context, CreateRunningController());
            const dbCon = dbMgr.controller;
            const ssCon = ssMgr.controller;
            const apCon = apMgr.controller;
            const controller = rcon.inner;
            context.databaseManager = dbMgr;
            context.sessionManager = ssMgr;
            context.appManager = apMgr;
            dbMgr.serve();
            ssMgr.serve();
            apMgr.serve();
            await Promise.all([
                dbCon.start(),
                ssCon.start(),
                apCon.start()
            ]);
            await controller.start();
            
            while (true) {
                if (dbCon.isPendingFor().stop) {
                    await dbCon.stop();
                    dbMgr.serve();
                    await dbCon.start();
                }
                if (ssCon.isPendingFor().stop) {
                    await ssCon.stop();
                    ssMgr.serve();
                    await ssCon.start();
                }
                if (apCon.isPendingFor().stop) {
                    await apCon.stop();
                    apMgr.serve();
                    await apCon.start();
                }
                await Promise.any([
                    dbCon.waitFor(false),
                    ssCon.waitFor(false),
                    apCon.waitFor(false),
                    controller.waitFor(false)
                ]);
                if (controller.isPendingFor().stop) {
                    break;
                }
            }
            
            await Promise.all([
                dbCon.stop(),
                ssCon.stop(),
                apCon.stop()
            ]);
            context.appManager = null;
            context.databaseManager = null;
            context.sessionManager = null;
            await controller.stop();
        }
    };
}