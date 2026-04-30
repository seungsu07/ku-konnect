import { z } from 'zod';

export namespace Dto {
    /**
     * @route POST /auth/signup
     */
    export const authSignup = z.object({
        id: z.string().min(6).max(18),
        password: z.string().min(6),
        name: z.string().min(2).max(6),
        student_id: z.string().length(10),
        dept_id: z.string().length(4),
        univ_mail: z.email().toLowerCase().endsWith('@korea.ac.kr'),
    });
    
    /**
     * @route GET /auth/session/get
     */
    export const authSessionGet = z.object({
        duration: z.number(),
    });

    /**
     * @route GET /cert/univmail/get
     */
    export const certUnivmailGet = z.object({
        univ_mail: z.email().toLowerCase().endsWith('@korea.ac.kr'),
    });

    /**
     * @route POST /cert/univmail/check
     */
    export const certUnivmailCheck = z.object({
        univ_mail: z.email().toLowerCase().endsWith('@korea.ac.kr'),
        cert_num: z.string().length(6),
    });
}