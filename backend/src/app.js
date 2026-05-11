
/**
 * @import { RequestHandler } from 'express'
 * @import { RunningController } from './controller'
 * @import { ServerContext } from './server'
 * @import { Path, Scheme, PATH_ROUTE } from '../../common/dto'
 */

import express from 'express';
import { Temporal } from '@js-temporal/polyfill';





// ====================
// Express
// ====================

/** @typedef {ReturnType<typeof CreateAppManager>} AppManager */

/**
 * @param {ServerContext} context
 * @param {RunningController} rcon
 */
export function CreateAppManager(context, rcon) {
    const app = express();

    app.use(express.json());

    app.use(/** @type {express.ErrorRequestHandler} */
        (err, req, res, next) => {
            res.status(400).json({ e: 'invalid json scheme' });
            return;
        }
    );
    
    /**
     * @typedef {`${string}-${string}-${string}-${string}-${string}`} UUID
     */
    
    /**
     * @param {string} uuid
     * @returns {uuid is UUID}
     */
    function checkUUID(uuid) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(uuid);
    }
    
    /**
     * @template {Path} T
     * @template {keyof PATH_ROUTE[T]} U
     * @template {any} V
     * @param {T} path
     * @param {U} method
     * @param {RequestHandler<V, Scheme<T, U, 'RES'>, Scheme<T, U, 'REQ'>>} fn
     * @returns {[T, RequestHandler<V, Scheme<T, U, 'RES'>, Scheme<T, U, 'REQ'>]}
     */
    function handler(path, method, fn) {
        /** @type {RequestHandler} */
        function h(req, res) {
            
        }
    }
    
    const test = handler('/api/auth/signup', 'POST', (req, res) => {
        req.body.name
    });

    app.post('/auth/signup', (req, res) => {
        /** @type {Record<string, unknown>} */
        const {
            campus,
            college,
            department,
            student_id,
            name,
            login_id,
            password,
            univ_mail
        } = req.body;
        if (
            typeof campus != 'string' ||
            !checkUUID(campus)
        ) {
            res.status(400).json()
        }
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