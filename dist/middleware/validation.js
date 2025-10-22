"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationGQL = exports.Validation = void 0;
const classError_1 = require("../utils/classError");
const graphql_1 = require("graphql");
const Validation = (schema) => {
    return (req, res, next) => {
        const validationErrors = [];
        for (const key of Object.keys(schema)) {
            if (!schema[key])
                continue;
            if (req?.file)
                req.body.attachments = req.file;
            if (req?.files)
                req.body.attachments = req.files;
            const result = schema[key].safeParse(req[key]);
            if (!result.success)
                validationErrors.push(result.error);
        }
        if (validationErrors.length)
            throw new classError_1.AppError(JSON.parse(validationErrors), 400);
        next();
    };
};
exports.Validation = Validation;
const ValidationGQL = async (schema, args) => {
    const validationErrors = [];
    const result = schema.safeParse(args);
    if (!result.success)
        validationErrors.push(result.error);
    if (validationErrors.length)
        throw new graphql_1.GraphQLError("Validation Error", {
            extensions: {
                code: "VALIDATION_ERROR",
                http: { status: 400 },
                error: JSON.parse(validationErrors)
            }
        });
};
exports.ValidationGQL = ValidationGQL;
