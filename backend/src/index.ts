import "reflect-metadata";
import { main, spawn, suspend } from "effection";
import { ServerManager } from "./server.js";
import { ApiManager, createApiChannel } from "./api.js";

main(function* () {
    const apiChannel = createApiChannel();
    
    yield* spawn(() => ServerManager({ apiChannel }));
    yield* spawn(() => ApiManager({ apiChannel }));
    
    yield* suspend();
});
