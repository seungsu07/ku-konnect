import { Worker } from 'node:worker_threads';
import { ProtoTasks, MAX_TASKS, taskProcessorFactory, Settings } from './worker.js';

const worker = new Worker('./worker.ts');

