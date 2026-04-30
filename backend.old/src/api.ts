import { suspend, createChannel, each } from 'effection';
import { z } from 'zod';
import { type Session } from '../../common/models.js';
import { type ApiChannel } from './api-base.js';
import { Dto } from '../../common/dto.js';
import { Db } from './database.js';

export function createApiChannel(): ApiChannel { return createChannel(); }

export function* ApiManager(param: { apiChannel: ApiChannel }) {
    for (const { action, data, reject, resolve } of yield* each(param.apiChannel)) {
        if (action == 'auth.signup') {
            const { id, password, name, student_id, dept_id } = data as z.infer<typeof Dto.authSignup>;
            Db.userDb
        }
    }

    yield* suspend();
}
