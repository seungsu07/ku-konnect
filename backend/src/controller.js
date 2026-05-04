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
 * @property {() => { start: boolean; stop: boolean; }} isPendingFor
 * @property {(running: boolean) => Promise<void>} waitFor
 * @property {(result?: any) => Promise<void>} stop
 * @property {() => Promise<void>} start
 */

/** @returns {RunningController} */
export function CreateRunningController() {
    /** @type {{ promise: Promise<void>; resolve: (v?: any) => void; }} */
    let inner_con = Promise.withResolvers();
    /** @type {{ promise: Promise<void>; resolve: (v?: any) => void; }} */
    let outer_con = Promise.withResolvers();
    const inner_pending = {
        start: false,
        stop: false
    };
    const outer_pending = {
        start: false,
        stop: false
    };
    
    /** @type {MonoController} */
    const inner = {
        running: false,
        result: undefined,
        
        isPendingFor() {
            return {
                start: inner_pending.start,
                stop: inner_pending.stop
            };
        },
        
        async waitFor(running) {
            while (true) {
                if (outer.running == running) return;
                await inner_con.promise;
            }
        },
        
        async stop(result=undefined) {
            outer.result = result;
            this.running = false;
            if (!inner_pending.stop)
                outer_pending.stop = true;
            const resv = outer_con.resolve;
            outer_con = Promise.withResolvers();
            resv();
            await this.waitFor(false);
            inner_pending.stop = false;
        },
        
        async start() {
            outer.result = undefined;
            this.running = true;
            if (!inner_pending.start)
                outer_pending.start = true;
            const resv = outer_con.resolve;
            outer_con = Promise.withResolvers();
            resv();
            await this.waitFor(true);
            inner_pending.start = false;
        }
    };
    
    /** @type {MonoController} */
    const outer = {
        running: false,
        result: undefined,
        
        isPendingFor() {
            return {
                start: outer_pending.start,
                stop: outer_pending.stop
            };
        },
        
        async waitFor(running) {
            while (true) {
                if (inner.running == running) return;
                await outer_con.promise;
            }
        },
        
        async stop(result=undefined) {
            inner.result = result;
            this.running = false;
            if (!outer_pending.stop)
                inner_pending.stop = true;
            const resv = inner_con.resolve;
            inner_con = Promise.withResolvers();
            resv();
            await this.waitFor(false);
            outer_pending.stop = false;
        },
        
        async start() {
            inner.result = undefined;
            this.running = true;
            if (!outer_pending.start)
                inner_pending.start = true;
            const resv = inner_con.resolve;
            inner_con = Promise.withResolvers();
            resv();
            await this.waitFor(true);
            outer_pending.start = false;
        }
    };
    
    return { inner, outer };
}