"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorizationGQL = exports.Authorization = exports.AuthenticationGQL = exports.Authentication = void 0;
const classError_1 = require("../utils/classError");
const token_1 = require("../utils/token");
const graphql_1 = require("graphql");
const Authentication = (tokenType = token_1.TokenType.access) => {
    return async (req, res, next) => {
        const { authorization } = req.headers;
        const [prefix, token] = authorization?.split(" ") || [];
        if (!prefix || !token)
            throw new classError_1.AppError("Invalid token", 400);
        const signature = await (0, token_1.getSignature)(prefix, tokenType);
        if (!signature)
            throw new Error("Invalid prefix token", { cause: 404 });
        const decoded = await (0, token_1.decodeTokenAndFetchUser)(token, signature);
        req.user = decoded?.user;
        req.decodedToken = decoded?.decodedToken;
        return next();
    };
};
exports.Authentication = Authentication;
const AuthenticationGQL = async (authorization, tokenType = token_1.TokenType.access) => {
    const [prefix, token] = authorization?.split(" ") || [];
    if (!prefix || !token)
        throw new graphql_1.GraphQLError("Invalid token", {
            extensions: {
                code: "TOKEN_NOT_FOUND",
                http: {
                    code: 404
                }
            }
        });
    const signature = await (0, token_1.getSignature)(prefix, tokenType);
    if (!signature)
        throw new graphql_1.GraphQLError("Invalid token", {
            extensions: {
                code: "INVALID_SIGNTURE",
                http: {
                    code: 400
                }
            }
        });
    const { decodedToken, user } = await (0, token_1.decodeTokenAndFetchUser)(token, signature);
    return { decodedToken, user };
};
exports.AuthenticationGQL = AuthenticationGQL;
const Authorization = ({ accessRoles = [] }) => {
    return (req, res, next) => {
        if (!accessRoles.includes(req.user?.role))
            throw new classError_1.AppError("Unauthorized", 401);
        next();
    };
};
exports.Authorization = Authorization;
const AuthorizationGQL = async ({ accessRoles = [], role }) => {
    if (!accessRoles.includes(role))
        throw new graphql_1.GraphQLError("Unauthorized", { extensions: { code: "UNAUTHORIZED", statusCode: 401 } });
    return true;
};
exports.AuthorizationGQL = AuthorizationGQL;
