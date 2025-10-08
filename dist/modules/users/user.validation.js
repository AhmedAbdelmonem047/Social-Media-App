"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAccountSchema = exports.acceptDeleteSchema = exports.freezeAccountSchema = exports.resetPasswordSchema = exports.forgetPasswordSchema = exports.confirmEmailSchema = exports.signupSchema = exports.logoutSchema = exports.loginWithGmailSchema = exports.loginSchema = void 0;
const friendRequest_model_1 = require("./../../DB/models/friendRequest.model");
const zod_1 = __importDefault(require("zod"));
const user_model_1 = require("../../DB/models/user.model");
const generalRules_1 = require("../../utils/generalRules");
exports.loginSchema = {
    body: zod_1.default.object({
        email: zod_1.default.email(),
        password: zod_1.default.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
    }).required()
};
exports.loginWithGmailSchema = {
    body: zod_1.default.object({
        idToken: zod_1.default.string()
    }).required()
};
exports.logoutSchema = {
    body: zod_1.default.object({
        flag: zod_1.default.enum(user_model_1.FlagType),
    }).required()
};
exports.signupSchema = {
    body: exports.loginSchema.body.extend({
        userName: zod_1.default.string().min(2).trim(),
        cPassword: zod_1.default.string(),
        age: zod_1.default.number().min(18).max(65),
        phone: zod_1.default.string().regex(/^01[0125][0-9]{8}$/),
        address: zod_1.default.string(),
        gender: zod_1.default.enum([user_model_1.GenderType.male, user_model_1.GenderType.female])
    }).required().superRefine((data, ctx) => {
        if (data.password !== data.cPassword)
            ctx.addIssue({ code: "custom", path: ["cPassword"], message: "Passwords don't match" });
    })
};
exports.confirmEmailSchema = {
    body: zod_1.default.object({
        email: zod_1.default.email(),
        otp: zod_1.default.string().regex(/^d{6}$/).trim()
    }).required()
};
exports.forgetPasswordSchema = {
    body: zod_1.default.object({
        email: zod_1.default.email(),
    }).required()
};
exports.resetPasswordSchema = {
    body: exports.confirmEmailSchema.body.extend({
        password: zod_1.default.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/),
        cPassword: zod_1.default.string()
    }).required().superRefine((data, ctx) => {
        if (data.password !== data.cPassword)
            ctx.addIssue({ code: "custom", path: ["cPassword"], message: "Passwords don't match" });
    })
};
exports.freezeAccountSchema = {
    params: zod_1.default.strictObject({
        userId: generalRules_1.generalRules.id
    })
};
exports.acceptDeleteSchema = {
    params: zod_1.default.strictObject({
        requestId: generalRules_1.generalRules.id,
        action: zod_1.default.enum([friendRequest_model_1.RequestActionEnum.accept, friendRequest_model_1.RequestActionEnum.delete])
    }).required()
};
exports.deleteAccountSchema = {
    params: zod_1.default.strictObject({
        userId: generalRules_1.generalRules.id
    }).required()
};
