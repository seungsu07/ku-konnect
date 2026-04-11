import { type Channel } from "effection";

export interface ApiRequest {
    data: any;
    resolve: Function;
    reject: Function;
}

export type ApiChannel = Channel<ApiRequest, void>;
