"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeTokenAndFetchUser = exports.getSignature = exports.VerifyToken = exports.GenerateToken = exports.TokenType = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const classError_1 = require("./classError");
const user_repository_1 = require("../repositories/user.repository");
const user_model_1 = __importDefault(require("../DB/models/user.model"));
const revokeToken_model_1 = __importDefault(require("../DB/models/revokeToken.model"));
const revokeToken_repository_1 = require("../repositories/revokeToken.repository");
var TokenType;
(function (TokenType) {
    TokenType["access"] = "access";
    TokenType["refresh"] = "refresh";
})(TokenType || (exports.TokenType = TokenType = {}));
const _userModel = new user_repository_1.UserRepository(user_model_1.default);
const _revokeTokenModel = new revokeToken_repository_1.RevokeTokenRepository(revokeToken_model_1.default);
const GenerateToken = async ({ payload, signature, options }) => {
    return jsonwebtoken_1.default.sign(payload, signature, options);
};
exports.GenerateToken = GenerateToken;
const VerifyToken = async ({ token, signature }) => {
    return jsonwebtoken_1.default.verify(token, signature);
};
exports.VerifyToken = VerifyToken;
const getSignature = async (prefix, tokenType = TokenType.access) => {
    if (tokenType === TokenType.access) {
        if (prefix === process.env.BEARER_USER)
            return process.env.ACCESS_TOKEN_USER;
        else if (prefix === process.env.BEARER_ADMIN)
            return process.env.ACCESS_TOKEN_ADMIN;
        else
            return null;
    }
    if (tokenType === TokenType.refresh) {
        if (prefix === process.env.BEARER_USER)
            return process.env.REFRESH_TOKEN_USER;
        else if (prefix === process.env.BEARER_ADMIN)
            return process.env.REFRESH_TOKEN_ADMIN;
        else
            return null;
    }
    return null;
};
exports.getSignature = getSignature;
const decodeTokenAndFetchUser = async (token, signature) => {
    const decodedToken = await (0, exports.VerifyToken)({ token, signature });
    if (!decodedToken)
        throw new classError_1.AppError("Invalid token", 400);
    const user = await _userModel.findOne({ _id: decodedToken.id });
    if (!user)
        throw new classError_1.AppError("User not found", 404);
    if (!user?.isConfirmed)
        throw new classError_1.AppError("Please confrim your email first before login", 400);
    if (await _revokeTokenModel.findOne({ tokenId: decodedToken?.jti }))
        throw new classError_1.AppError("Token has been revoked, please login again", 401);
    if (user?.changeCredentials?.getTime() > decodedToken.iat * 1000)
        throw new classError_1.AppError("Token has been revoked, please login again", 401);
    return { decodedToken, user };
};
exports.decodeTokenAndFetchUser = decodeTokenAndFetchUser;
