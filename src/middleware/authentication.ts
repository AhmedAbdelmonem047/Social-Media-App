import { RoleType } from './../DB/models/user.model';
import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/classError";
import { decodeTokenAndFetchUser, getSignature, TokenType } from "../utils/token";
import { GraphQLError } from 'graphql';

export const Authentication = (tokenType: TokenType = TokenType.access) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const { authorization } = req.headers;

        const [prefix, token] = authorization?.split(" ") || []

        if (!prefix || !token)
            throw new AppError("Invalid token", 400);

        const signature = await getSignature(prefix, tokenType);
        if (!signature)
            throw new Error("Invalid prefix token", { cause: 404 });


        // const revokeToken = await revokeTokenModel.find({ tokenId: decodedToken.jti });
        // if (revokeToken)
        //     throw new Error("Please login again", { cause: 400 });

        const decoded = await decodeTokenAndFetchUser(token, signature);

        req.user = decoded?.user;
        req.decodedToken = decoded?.decodedToken;

        return next()
    }
}

export const AuthenticationGQL = async (authorization: string, tokenType: TokenType = TokenType.access) => {

    const [prefix, token] = authorization?.split(" ") || []

    if (!prefix || !token)
        throw new GraphQLError("Invalid token", {
            extensions: {
                code: "TOKEN_NOT_FOUND",
                http: {
                    code: 404
                }
            }
        });

    const signature = await getSignature(prefix, tokenType);
    if (!signature)
        throw new GraphQLError("Invalid token", {
            extensions: {
                code: "INVALID_SIGNTURE",
                http: {
                    code: 400
                }
            }
        });

    const { decodedToken, user } = await decodeTokenAndFetchUser(token, signature);

    return { decodedToken, user }
}

export const Authorization = ({ accessRoles = [] }: { accessRoles: RoleType[] }) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!accessRoles.includes(req.user?.role!))
            throw new AppError("Unauthorized", 401);
        next();
    }
}

export const AuthorizationGQL = async ({ accessRoles = [], role }: { accessRoles: RoleType[], role: RoleType }) => {
    if (!accessRoles.includes(role))
        throw new GraphQLError("Unauthorized", { extensions: { code: "UNAUTHORIZED", statusCode: 401 } });
    return true
}