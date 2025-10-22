"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const classError_1 = require("./utils/classError");
const path_1 = require("path");
const dotenv_1 = require("dotenv");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = require("express-rate-limit");
const user_controller_1 = __importDefault(require("./modules/users/user.controller"));
const connectionDB_1 = __importDefault(require("./DB/connectionDB"));
const post_controller_1 = __importDefault(require("./modules/posts/post.controller"));
const s3_config_js_1 = require("./utils/s3.config.js");
const express_2 = require("graphql-http/lib/use/express");
const schema_gql_js_1 = require("./modules/graphql/schema.gql.js");
const gateway_js_1 = require("./modules/gateway/gateway.js");
(0, dotenv_1.config)({ path: (0, path_1.resolve)("./config/.env") });
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
const limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 5 * 60 * 1000,
    limit: 10,
    message: {
        error: "Too many requests, try again in 5 minutes"
    },
    legacyHeaders: false
});
const bootstrap = async () => {
    app.use(express_1.default.json());
    app.use((0, cors_1.default)());
    app.use((0, helmet_1.default)());
    await (0, connectionDB_1.default)();
    app.all('/graphql', (0, express_2.createHandler)({ schema: schema_gql_js_1.schemaGql, context: (req) => ({ req }) }));
    app.get('/', (req, res, next) => res.status(200).json({ message: "Welcome to SocialMediaApp" }));
    app.use('/users', user_controller_1.default);
    app.use('/posts', post_controller_1.default);
    app.get("/upload/*path", async (req, res, next) => {
        const { path } = req.params;
        const Key = path.join("/");
        const result = await (0, s3_config_js_1.getFile)({ Key });
        const stream = result.Body;
        res.set("cross-origin-resource-policy", "cross-origin");
        res.setHeader("Content-Type", result?.ContentType || "application/oclet-stream");
        stream.pipe(res);
    });
    app.get('{/*z}', (req, res, next) => {
        throw new classError_1.AppError(`Invalid URL ${req.originalUrl}`, 404);
    });
    app.use((err, req, res, next) => {
        return res.status(err.statusCode || 500).json({ message: err.message, stack: err.stack });
    });
    const httpServer = app.listen(port, () => console.log(`SocialMediaApp listening on port ${port}!`));
    (0, gateway_js_1.initializeGateway)(httpServer);
};
exports.default = bootstrap;
