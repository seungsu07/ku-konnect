import "reflect-metadata";
import { main, spawn, suspend } from "effection";
import { ServerManager } from "./server.js";
import { ApiManager, apiChannel } from "./api.js";

main(function* () {
    yield* spawn(() => ServerManager(apiChannel));
    yield* spawn(ApiManager);
    
    yield* suspend();
});
