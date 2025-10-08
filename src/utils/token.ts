import jwt, { JwtPayload } from "jsonwebtoken"
import { AppError } from "./classError";
import { UserRepository } from "../repositories/user.repository";
import userModel from "../DB/models/user.model";
import revokeTokenModel from "../DB/models/revokeToken.model";
import { RevokeTokenRepository } from "../repositories/revokeToken.repository";

export enum TokenType {
    access = "access",
    refresh = "refresh"
}

const _userModel = new UserRepository(userModel);
const _revokeTokenModel = new RevokeTokenRepository(revokeTokenModel);

export const GenerateToken = async ({ payload, signature, options }: { payload: Object, signature: string, options: jwt.SignOptions }) => {
    return jwt.sign(payload, signature, options);
}

export const VerifyToken = async ({ token, signature }: { token: string, signature: string }): Promise<JwtPayload> => {
    return jwt.verify(token, signature) as JwtPayload;
}

export const getSignature = async (tokenType: TokenType, prefix: string) => {
    if (tokenType === TokenType.access) {
        if (prefix === process.env.BEARER_USER)
            return process.env.ACCESS_TOKEN_USER!
        else if (prefix === process.env.BEARER_ADMIN)
            return process.env.ACCESS_TOKEN_ADMIN!
        else
            return null
    }
    if (tokenType === TokenType.refresh) {
        if (prefix === process.env.BEARER_USER)
            return process.env.REFRESH_TOKEN_USER!
        else if (prefix === process.env.BEARER_ADMIN)
            return process.env.REFRESH_TOKEN_ADMIN!
        else
            return null
    }
    return null
}

export const decodeTokenAndFetchUser = async (token: string, signature: string) => {
    const decodedToken = await VerifyToken({ token, signature });
    if (!decodedToken)
        throw new AppError("Invalid token", 400);
    const user = await _userModel.findOne({ email: decodedToken.email });
    if (!user)
        throw new AppError("User not found", 404);
    if (!user?.isConfirmed)
        throw new AppError("Please confrim your email first before login", 400);
    if (await _revokeTokenModel.findOne({ tokenId: decodedToken?.jti }))
        throw new AppError("Token has been revoked, please login again", 401);
    if (user?.changeCredentials?.getTime()! > decodedToken.iat! * 1000)
        throw new AppError("Token has been revoked, please login again", 401);
    // if (!user?.isDeleted)
    //     throw new AppError("User has been deleted, contact admin for more info", 400);
    return { decodedToken, user };
}