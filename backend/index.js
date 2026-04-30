import { CreateServer } from './src/server.js';
import { CreateRunningController } from './src/controller.js';

// ====================

(async function main() {
    const server = CreateServer(CreateRunningController());
    server.serve();
    await server.controller.start();
    console.log(server);
    server.controller.stop();
    console.log(server.controller.isPendingFor().stop);
    await server.controller.waitFor(false);
    console.log(server);
})();