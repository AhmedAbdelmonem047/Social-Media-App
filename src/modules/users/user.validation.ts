import { RequestActionEnum } from './../../DB/models/friendRequest.model';
import z from 'zod'
import { FlagType, GenderType } from '../../DB/models/user.model';
import { generalRules } from '../../utils/generalRules';

export const loginSchema = {
    body: z.object({
        email: z.email(),
        password: z.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
    }).required()
}

export const loginWithGmailSchema = {
    body: z.object({
        idToken: z.string()
    }).required()
}


export const logoutSchema = {
    body: z.object({
        flag: z.enum(FlagType),
    }).required()
}

export const signupSchema = {
    body: loginSchema.body.extend({
        userName: z.string().min(2).trim(),
        cPassword: z.string(),
        age: z.number().min(18).max(65),
        phone: z.string().regex(/^01[0125][0-9]{8}$/),
        address: z.string(),
        gender: z.enum([GenderType.male, GenderType.female])
    }).required().superRefine((data, ctx) => {
        if (data.password !== data.cPassword)
            ctx.addIssue({ code: "custom", path: ["cPassword"], message: "Passwords don't match" });
    })
}

export const confirmEmailSchema = {
    body: z.object({
        email: z.email(),
        otp: z.string().regex(/^d{6}$/).trim()
    }).required()
}

export const forgetPasswordSchema = {
    body: z.object({
        email: z.email(),
    }).required()
}

export const resetPasswordSchema = {
    body: confirmEmailSchema.body.extend({
        password: z.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/),
        cPassword: z.string()
    }).required().superRefine((data, ctx) => {
        if (data.password !== data.cPassword)
            ctx.addIssue({ code: "custom", path: ["cPassword"], message: "Passwords don't match" });
    })
}

export const freezeAccountSchema = {
    params: z.strictObject({
        userId: generalRules.id
    })
}

export const acceptDeleteSchema = {
    params: z.strictObject({
        requestId: generalRules.id,
        action: z.enum([RequestActionEnum.accept, RequestActionEnum.delete])
    }).required()
}

export const deleteAccountSchema = {
    params: z.strictObject({
        userId: generalRules.id
    }).required()
}

export type loginSchemaType = z.infer<typeof loginSchema.body>
export type loginWithGmailSchemaType = z.infer<typeof loginWithGmailSchema.body>
export type logoutSchemaType = z.infer<typeof logoutSchema.body>
export type signupSchemaType = z.infer<typeof signupSchema.body>
export type confirmEmailSchemaType = z.infer<typeof confirmEmailSchema.body>
export type forgetPasswordSchemaType = z.infer<typeof forgetPasswordSchema.body>
export type resetPasswordSchemaType = z.infer<typeof resetPasswordSchema.body>