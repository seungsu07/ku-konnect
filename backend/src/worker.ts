import { workerData, parentPort, isMainThread, receiveMessageOnPort } from 'node:worker_threads';
import Express from 'express';

export const Settings = {
    port: 3000,
    hostname: '0.0.0.0'
};

export const ProtoTasks = {
    async post(url: string, data: {[K: string]: any}) {
        const result = await fetch(url, {headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
        return await result.json();
    }
};

export const MAX_TASKS = 1024;

/**
 * Runs on main thread
 */
export function taskProcessorFactory() {
    // TODO
    return function taskProcess() {};
}

type TaskName = keyof typeof ProtoTasks;
type ProtoTask = typeof ProtoTasks[TaskName];
type TaskFn = (fn: ProtoTask) => any;

function taskFactory(): TaskFn {
    const flagBuffer = new SharedArrayBuffer(MAX_TASKS * 4);
    const flagArray = new Int32Array(flagBuffer);
    parentPort!.postMessage({type: 'init', array: flagArray});
    return function task(fn: ProtoTask, ...args) {
        let index;
        find: {
            for (index = 0; index < MAX_TASKS; ++index) {
                const prev = Atomics.compareExchange(flagArray, index, 0, 1);
                if (prev == 0)
                    break find;
            }
            return null;
        }
        parentPort!.postMessage({type: 'task', index, name: fn.name, args});
        Atomics.wait(flagArray, index, 1);
        const result = receiveMessageOnPort(parentPort!);
        Atomics.store(flagArray, index, 0);
        return result;
    };
}

function main(task: TaskFn) {
    const server = Express();
    
    server.listen(Settings.port, Settings.hostname, () => {});
}

function init() {
    if (isMainThread) throw new Error();
    const task = taskFactory();
    main(task);
}

init();