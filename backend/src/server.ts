import {
    default as express,
    type ErrorRequestHandler,
    type RequestHandler,
} from 'express';
import { default as createHttpError, isHttpError } from 'http-errors';
import { suspend } from 'effection';
import { z } from 'zod';
import {
    type ApiChannel,
    type ApiResultSuccess,
    type ApiResultFailed,
} from './api-base.js';
import { Dto } from '../../common/dto.js';

export function* ServerManager(param: { apiChannel: ApiChannel }) {
    const host = '0.0.0.0';
    const port = 3000;
    const apiChannel = param.apiChannel;

    function createRequestHandler<T extends z.ZodRawShape>(
        scheme: z.ZodObject<T>,
        action: string,
    ): RequestHandler {
        return (req, res, next) => {
            const data = ((method) => {
                if (method === 'GET') {
                    try { return JSON.parse(atob(req.query.data as string)); } catch (_) { return null; }
                }
                if (method === 'POST') {
                    return req.body;
                }
                return null;
            })(req.method);
            if (data == null) {
                res.locals.result = {
                    status: 400,
                    data: {
                        success: false,
                        message: 'invalid request scheme',
                        errDetails: {},
                    },
                } as ApiResultFailed;
            }
            const parseResult = scheme.safeParse(data);
            if (parseResult.success === false) {
                res.locals.result = {
                    status: 400,
                    data: {
                        success: false,
                        message: 'invalid data scheme',
                        errDetails: z.treeifyError(parseResult.error),
                    },
                } as ApiResultFailed;
                return next(createHttpError(400));
            }
            function resolve(apiResult: ApiResultSuccess) {
                res.locals.result = apiResult;
                return next();
            }
            function reject(apiResult: ApiResultFailed) {
                res.locals.result = apiResult;
                return next(createHttpError(apiResult.status));
            }
            apiChannel.send({
                action,
                data: parseResult.data,
                resolve,
                reject,
            });
        };
    }

    const app = express();

    app.use(express.json());

    app.use(((err, req, res, next) => {
        res.locals.result = {
            status: 400,
            data: {
                success: false,
                message: 'invalid JSON',
                errDetails: {},
            },
        } as ApiResultFailed;
        return next(createHttpError(400));
    }) as ErrorRequestHandler);

    app.all('/', (req, res) => {
        return res.json('OK');
    });

    app.post(
        '/auth/signup',
        createRequestHandler(Dto.authSignup, 'auth.signup'),
    );

    app.post(
        '/cert/univmail/get',
        createRequestHandler(Dto.certUnivmailGet, 'cert.univmail.get'),
    );

    app.post(
        '/cert/univmail/check',
        createRequestHandler(Dto.certUnivmailCheck, 'cert.univmail.check'),
    );

    // TODO

    /** no route */
    app.use((req, res, next) => {
        if (res.locals.result === undefined) {
            return res.status(404).json({ error: 'not found' });
        }
        return res
            .status(res.locals.result.status)
            .json(res.locals.result.data);
    });

    /** api error */
    app.use(((err, req, res, next) => {
        if (isHttpError(err)) {
            return res.status(err.statusCode).json({
                error: err.message,
                details: err.details,
            });
        }
        return next(err);
    }) as ErrorRequestHandler);

    /** unexpected */
    app.use(((err, req, res, next) => {
        return res.status(500).json({ error: 'internal server error' });
    }) as ErrorRequestHandler);

    app.listen(port, host, () => {
        console.log('Server is now running!');
    });

    yield* suspend();
}
