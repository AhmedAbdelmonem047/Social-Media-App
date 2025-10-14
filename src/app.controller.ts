import { AppError } from './utils/classError';
import { resolve } from 'path'
import { config } from 'dotenv'
import express, { NextFunction, Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import userRouter from './modules/users/user.controller';
import connectionDB from './DB/connectionDB';
import postRouter from './modules/posts/post.controller';
import { getFile } from './utils/s3.config.js';

config({ path: resolve("./config/.env") })

const app: express.Application = express()
const port: string | number = process.env.PORT || 5000
const limiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    limit: 10,
    message: {
        error: "Too many requests, try again in 5 minutes"
    },
    legacyHeaders: false
});

const bootstrap = async () => {

    app.use(express.json());
    app.use(cors());
    app.use(helmet());
    app.use(limiter);
    await connectionDB();

    app.get('/', (req: Request, res: Response, next: NextFunction) => res.status(200).json({ message: "Welcome to SocialMediaApp" }));

    app.use('/users', userRouter);
    app.use('/posts', postRouter);

    app.get("/upload/*path", async (req: Request, res: Response, next: NextFunction) => {
        const { path } = req.params as unknown as { path: string[] };
        const Key = path.join("/");
        const result = await getFile({ Key });
        const stream = result.Body as NodeJS.ReadableStream;
        res.set("cross-origin-resource-policy", "cross-origin");
        res.setHeader("Content-Type", result?.ContentType || "application/oclet-stream");
        stream.pipe(res);
    })

    app.get('{/*z}', (req: Request, res: Response, next: NextFunction) => {
        throw new AppError(`Invalid URL ${req.originalUrl}`, 404);
    })

    app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
        return res.status(err.statusCode as unknown as number || 500).json({ message: err.message, stack: err.stack })
    })

    const httpServer = app.listen(port, () => console.log(`SocialMediaApp listening on port ${port}!`))
}

export default bootstrap;