import { suspend, createChannel, each } from "effection";
import { type ApiChannel } from "./api-base.js";

export const apiChannel: ApiChannel = createChannel();

export function* ApiManager() {
    for (const { data, reject, resolve } of yield* each(apiChannel)) {
        // TODO
    }

    yield* suspend();
}
