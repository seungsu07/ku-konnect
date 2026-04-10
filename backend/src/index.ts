import 'reflect-metadata';
import { createExpressServer } from 'routing-controllers';
import { main, suspend } from 'effection';
import { RootCon, AuthCon } from './controllers.js';

main(function* () {
    const host = '0.0.0.0';
    const port = 3000;
    
    const app = createExpressServer({
        controllers: [RootCon, AuthCon],
        middlewares: [],
        validation: true,
        classTransformer: true,
        development: false
    });
    
    app.listen(port, host, () => {
        console.log('Server is now running!');
    });
    
    yield* suspend();
});