
/**
 * @import { Session, SessionID, UserID } from '../common/models'
 */

import express from 'express';
import { Temporal } from '@js-temporal/polyfill';

// ====================
// Running Controller
// ====================

/**
 * @typedef {{ inner: MonoController; outer: MonoController }} RunningController
 */

/**
 * @typedef MonoController
 * @property {boolean} running
 * @property {any} result
 * @property {(running?: boolean) => Promise<void>} waitFor
 * @property {(result?: any) => Promise<void>} stop
 * @property {() => Promise<void>} start
 */

/** @returns {RunningController} */
function CreateRunningController() {
    /** @type {{ promise: Promise<void>; resolve: (v?: any) => void; }} */
    let inner_con = Promise.withResolvers();
    /** @type {{ promise: Promise<void>; resolve: (v?: any) => void; }} */
    let outer_con = Promise.withResolvers();
    
    const inner = {
        running: false,
        result: undefined,
        
        async waitFor(running=true) {
            while (true) {
                if (outer.running == running) return;
                await inner_con.promise;
            }
        },
        
        async stop(result=undefined) {
            outer.result = result;
            this.running = false;
            const resv = outer_con.resolve;
            outer_con = Promise.withResolvers();
            resv();
            await this.waitFor(false);
        },
        
        async start() {
            outer.result = undefined;
            this.running = true;
            const resv = outer_con.resolve;
            outer_con = Promise.withResolvers();
            resv();
            await this.waitFor(true);
        }
    };
    
    const outer = {
        running: false,
        result: undefined,
        
        async waitFor(running=true) {
            while (true) {
                if (inner.running == running) return;
                await outer_con.promise;
            }
        },
        
        async stop(result=undefined) {
            inner.result = result;
            this.running = false;
            const resv = inner_con.resolve;
            inner_con = Promise.withResolvers();
            resv();
            await this.waitFor(false);
        },
        
        async start() {
            inner.result = undefined;
            this.running = true;
            const resv = inner_con.resolve;
            inner_con = Promise.withResolvers();
            resv();
            await this.waitFor(true);
        }
    };
    
    return { inner, outer };
}





// ====================
// Database
// ====================

/**
 * @param {ServerContext} context
 * @param {RunningController} rcon
 */

function DatabaseManager(context, rcon) {
    
    
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
                
                if (!controller.running) {
                    break;
                }
                const { promise: delay_prom, resolve } = Promise.withResolvers();
                setTimeout(resolve, delay.total('millisecond'));
                await delay_prom;
            }
        }
    };
}





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

function LoginSessionManager(context, rcon) {
    /** @type {Map<SessionID, LoginSession>} */
    const sessionMap = new Map();
    /** @type {Map<UserID, SessionID[]>} */
    const userMap = new Map();
    /** @type {SessionID[]} */
    const registerQueue = [];
    /** @type {SessionID[]} */
    const garbageQueue = [];
    
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
            const user = userMap.getOrInsert(user_id, []);
            user.push(session_id);
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
                return user.map(e => this.expire(e)).flat();
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
            
            while (true) {
                const rqTemp = registerQueue.splice(0);
                rqTemp.forEach(e => {
                    const session = sessionMap.get(e);
                    if (!session) return;
                    if (session.expired) return;
                    dbManager.createSession(session);
                });
                const gqTemp = garbageQueue.splice(0);
                gqTemp.forEach(e => dbManager.deleteSession(e));
                if (!controller.running) {
                    break;
                }
                const { promise: delay_prom, resolve } = Promise.withResolvers();
                setTimeout(resolve, delay.total('millisecond'));
                await delay_prom;
            }
        }
    };
}





// ====================
// Express
// ====================

/**
 * @param {ServerContext} context
 * @param {RunningController} rcon
 */

function AppManager(context, rcon) {
    const app = express();

    app.use(express.json());

    app.use(/** @type {express.ErrorRequestHandler} */
        (err, req, res, next) => {
            res.status(400).json({ e: 'invalid json scheme' });
            return;
        }
    );

    app.all('/', (req, res) => {
        
    });

    app.use(/** @type {express.ErrorRequestHandler} */
        (err, req, res, next) => {
            res.status(500).json({ e: 'unexpected' });
            return;
        }
    );
    
    return {
        controller: rcon.outer,
        
        async serve(delay=Temporal.Duration.from({ minutes: 3 })) {
            const controller = rcon.inner;
            await controller.start();
            
            while (true) {
                
                if (!controller.running) {
                    break;
                }
                const { promise: delay_prom, resolve } = Promise.withResolvers();
                setTimeout(resolve, delay.total('millisecond'));
                await delay_prom;
            }
        }
    };
}





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
function CreateServer(rcon) {
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
                if (!dbCon.running) {
                    dbCon.start();
                    await dbCon.waitFor(true);
                }
                if (!controller.running) {
                    break;
                }
                await Promise.any([
                    dbCon.waitFor(false),
                    lsCon.waitFor(false),
                    apCon.waitFor(false),
                    controller.waitFor(false)
                ]);
            }
            
            await Promise.all([
                dbCon.stop(),
                lsCon.stop(),
                apCon.stop()
            ]);
            context.appManager = null;
            context.databaseManager = null;
            context.loginSessionManager = null;
        }
    };
}





// ====================

(async function main() {
    const server = CreateServer(CreateRunningController());
    server.serve();
    
})();