"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Authorization = exports.Authentication = void 0;
const classError_1 = require("../utils/classError");
const token_1 = require("../utils/token");
const Authentication = (tokenType = token_1.TokenType.access) => {
    return async (req, res, next) => {
        const { authorization } = req.headers;
        const [prefix, token] = authorization?.split(" ") || [];
        if (!prefix || !token)
            throw new classError_1.AppError("Invalid token", 400);
        const signature = await (0, token_1.getSignature)(tokenType, prefix);
        if (!signature)
            throw new Error("Invalid prefix token", { cause: 404 });
        const decoded = await (0, token_1.decodeTokenAndFetchUser)(token, signature);
        req.user = decoded?.user;
        req.decodedToken = decoded?.decodedToken;
        return next();
    };
};
exports.Authentication = Authentication;
const Authorization = ({ accessRoles = [] }) => {
    return (req, res, next) => {
        if (!accessRoles.includes(req.user?.role))
            throw new classError_1.AppError("Unauthorized", 401);
        next();
    };
};
exports.Authorization = Authorization;
