import { CreateServer } from './src/server.js';
import { CreateRunningController } from './src/controller.js';

// ====================
// 테스트 코드
// ====================

(async function main() {
    const server = CreateServer(CreateRunningController());
    server.serve();
    await server.controller.start();
    console.log('Server is running');
    await server.controller.waitFor(false);
    console.log('Server stopped');
})();
