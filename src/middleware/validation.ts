import { NextFunction, Request, Response } from "express"
import { ZodType } from "zod"
import { AppError } from "../utils/classError"
import { GraphQLError } from "graphql"

type ReqType = keyof Request
type SchemaType = Partial<Record<ReqType, ZodType>>

export const Validation = (schema: SchemaType) => {
    return (req: Request, res: Response, next: NextFunction) => {

        const validationErrors = []

        for (const key of Object.keys(schema) as ReqType[]) {
            if (!schema[key]) continue;
            if (req?.file)
                req.body.attachments = req.file;
            if (req?.files)
                req.body.attachments = req.files;
            const result = schema[key].safeParse(req[key]);
            if (!result.success)
                validationErrors.push(result.error);
        }

        if (validationErrors.length)
            throw new AppError(JSON.parse(validationErrors as unknown as string), 400);

        next();
    }
}

export const ValidationGQL = async <T>(schema: ZodType, args: T) => {
    const validationErrors = []


    const result = schema.safeParse(args);
    if (!result.success)
        validationErrors.push(result.error);


    if (validationErrors.length)
        throw new GraphQLError("Validation Error", {
            extensions: {
                code: "VALIDATION_ERROR",
                http: { status: 400 },
                error: JSON.parse(validationErrors as unknown as string)
            }
        });


}