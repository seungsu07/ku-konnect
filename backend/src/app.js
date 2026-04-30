
/**
 * @import { RunningController } from './controller'
 * @import { ServerContext } from './server'
 */

import express from 'express';
import { Temporal } from '@js-temporal/polyfill';





// ====================
// Express
// ====================

/**
 * @param {ServerContext} context
 * @param {RunningController} rcon
 */

export function AppManager(context, rcon) {
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