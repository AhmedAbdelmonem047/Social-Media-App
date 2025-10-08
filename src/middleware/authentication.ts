import { RoleType } from './../DB/models/user.model';
import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/classError";
import { decodeTokenAndFetchUser, getSignature, TokenType } from "../utils/token";

export const Authentication = (tokenType: TokenType = TokenType.access) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const { authorization } = req.headers;

        const [prefix, token] = authorization?.split(" ") || []

        if (!prefix || !token)
            throw new AppError("Invalid token", 400);

        const signature = await getSignature(tokenType, prefix);
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

export const Authorization = ({ accessRoles = [] }: { accessRoles: RoleType[] }) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!accessRoles.includes(req.user?.role!))
            throw new AppError("Unauthorized", 401);
        next();
    }
}