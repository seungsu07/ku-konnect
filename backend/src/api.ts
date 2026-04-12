import { suspend, createChannel, each } from "effection";
import { type ApiChannel } from "./api-base.js";

export function createApiChannel(): ApiChannel { return createChannel(); }

export function* ApiManager(param: { apiChannel: ApiChannel }) {
    for (const { data, reject, resolve } of yield* each(param.apiChannel)) {
        // TODO
    }

    yield* suspend();
}
