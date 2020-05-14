import * as cors from 'cors';
import * as express from 'express';
import { NextFunction, Request, Response } from 'express';
import * as helmet from 'helmet';
import * as mongoose from 'mongoose';
import { resolve as resolvePath } from 'path';

import { config } from './configs';
import { ResponseStatusCodeEnum } from './constants';
import { apiRouter, notFoundRouter } from './routes';

class App {
    public readonly app: express.Application = express();

    constructor() {
        (global as any).appRoot = resolvePath(process.cwd(), '../');

        this.app.use(helmet());
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.urlencoded({extended: true}));
        this.app.use(express.static(resolvePath((global as any).appRoot, 'static')));

        this.mountRoutes();
        this.setupDB();

        this.app.use(this.clientErrorHandler);
    }

    private setupDB(): void {
        const mongoDB = `mongodb://${config.DATABASE_IP}:${config.DATABASE_PORT}/${config.DATABASE_NAME}`;
        mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true});
        mongoose.set('useFindAndModify', false);
        const db = mongoose.connection;
        db.on('error', console.error.bind(console, 'MongoDB Connection error'));
    }

    private mountRoutes(): void {
        this.app.use('/api', apiRouter);
        this.app.use('*', notFoundRouter);
    }

    private clientErrorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
        if (req.xhr) {
            res
                .status(ResponseStatusCodeEnum.SERVER_ERROR)
                .send({
                    error: {
                        message: 'Request dependent error!',
                        code: err.code,
                        data: err.data
                    }
                });
        } else {
            next(err);
        }
    }
}

export const app = new App().app;
