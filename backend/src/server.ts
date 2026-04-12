import Express from "express";
import { suspend } from "effection";
import { z } from "zod";
import { type ApiChannel } from "./api-base.js";

export function* ServerManager(apiChannel: ApiChannel) {
    const host = "0.0.0.0";
    const port = 3000;

    const app = Express();

    const SignUpScheme = z.object({
        id: z.string().min(6).max(18),
        password: z.string().min(6),
        name: z.string().min(2).max(6),
        student_id: z.string().length(10),
        dept_id: z.string().length(4),
    });

    app.all("/", (req, res) => {
        res.json("OK");
    });

    // app.all("/signup", (req, res) => {
    //     function resolve(data: { status: number; ok: boolean }) {
    //         res.status(data.status).json({ ok: data.ok });
    //     }
    //     function reject(data: { status: number; ok: boolean }) {
    //         res.status(data.status).json({ ok: data.ok });
    //     }
    //     apiChannel.send({ data: req, resolve, reject });
    // });

    app.listen(port, host, () => {
        console.log("Server is now running!");
    });

    yield* suspend();
}
