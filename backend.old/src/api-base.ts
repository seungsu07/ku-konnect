import { type Channel } from 'effection';
import { type Session } from '../../common/models.js';

export interface ApiRequest {
    session?: Session,
    action: string,
    data: {
        [K: string]: any;
    };
    resolve: Function;
    reject: Function;
}

export type ApiChannel = Channel<ApiRequest, void>;

export interface ApiResult {
    status: number;
    data: {
        [K: string]: any;
        success: boolean;
        message?: string;
        errDetails?: any;
    };
}

export interface ApiResultSuccess extends ApiResult {
    data: {
        [k: string]: any;
        success: true;
        message?: string;
    };
}

export interface ApiResultFailed extends ApiResult {
    data: {
        [k: string]: any;
        success: false;
        message: string;
        errDetails: any;
    };
}