import { default as express, type ErrorRequestHandler } from "express";
import { default as createHttpError, isHttpError, HttpError } from 'http-errors';
import { suspend } from "effection";
import { z } from "zod";
import { type ApiChannel, type ApiResult } from "./api-base.js";
import { createApiChannel } from "./api.js";

export function* ServerManager(param: { apiChannel: ApiChannel }) {
    const host = "0.0.0.0";
    const port = 3000;
    const apiChannel = param.apiChannel;
    
    function createRequestHandler<T extends z.ZodRawShape>(scheme: z.ZodObject<T>) {
        return function (req: express.Request, res: express.Response, next: express.NextFunction) {
            const parseResult = scheme.safeParse(req.body);
            if (parseResult.success === false) {
                next(createHttpError(400, 'invalid request scheme'));
                return;
            }
            function resolve(apiResult: ApiResult) {
                res.locals.result = apiResult;
                next();
            }
            function reject(err: HttpError) {
                next(err);
            }
            apiChannel.send({ data: parseResult.data, resolve, reject });
        };
    }

    const app = express();

    setJsonParser: {
        app.use(express.json());
    
        app.use(((err, req, res, next) => {
            next(createHttpError(400, 'invalid request scheme'));
        }) as ErrorRequestHandler);
    }

    setRootRouter: {
        app.all("/", (req, res) => {
            res.json("OK");
        });
    }

    setSignUpRouter: {
        const signUpScheme = z.object({
            id: z.string().min(6).max(18),
            password: z.string().min(6),
            name: z.string().min(2).max(6),
            student_id: z.string().length(10),
            dept_id: z.string().length(4),
        });
        
        app.post("/signup", createRequestHandler(signUpScheme));
    }
    
    setSignUpMailRouter: {
        const mailScheme = z.object({
            session: z.uuidv4(),
            univ_mail: z.email().toLowerCase().endsWith('@korea.ac.kr'),
        });
        
        app.post("/signup/mail", createRequestHandler(mailScheme));
    }
    
    setSignUpMailCertRouter: {
        const certScheme = z.object({
            session: z.uuidv4(),
            univ_mail: z.email().toLowerCase().endsWith('@korea.ac.kr'),
            cert_num: z.string().length(6),
        });
        
        app.post("/signup/mail/cert", createRequestHandler(certScheme));
    }
    
    // TODO
    
    setApiResultHandler: {
        app.use((req, res, next) => {
            if (res.locals.result === undefined) {
                res.status(404).json({ error: 'not found' });
                return;
            }
            res.status(res.locals.result.status).json(res.locals.result.data);
        });
    }

    setHttpErrorHandler: {
        app.use(((err, req, res, next) => {
            if (isHttpError(err)) {
                res.status(err.statusCode).json({ error: err.message });
                return;
            }
            next(err);
        }) as ErrorRequestHandler);
    }
    
    setUnexpectedErrorHandler: {
        app.use(((err, req, res, next) => {
            res.status(500).json({ error: 'internal server error' });
        }) as ErrorRequestHandler);
    }

    app.listen(port, host, () => {
        console.log("Server is now running!");
    });

    yield* suspend();
}
