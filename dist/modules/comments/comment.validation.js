"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCommentSchema = exports.getCommentSchema = exports.createCommentSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const generalRules_1 = require("../../utils/generalRules");
const comment_model_js_1 = require("../../DB/models/comment.model.js");
exports.createCommentSchema = {
    params: zod_1.default.strictObject({
        postId: generalRules_1.generalRules.id,
        commentId: generalRules_1.generalRules.id.optional()
    }),
    body: zod_1.default.strictObject({
        content: zod_1.default.string().min(5).max(1000).optional(),
        attachments: zod_1.default.array(generalRules_1.generalRules.file).max(2).optional(),
        tags: zod_1.default.array(generalRules_1.generalRules.id).refine((value) => { return new Set(value).size === value?.length; }, { message: "Duplicated tags" }).optional(),
        onModel: zod_1.default.enum(comment_model_js_1.onModelEnum)
    }).superRefine((data, ctx) => {
        if (!data?.content && !data?.attachments)
            ctx.addIssue({ code: "custom", path: ["content"], message: "Cant't create a Comment without content nor attachments" });
    })
};
exports.getCommentSchema = {
    params: zod_1.default.strictObject({
        postId: generalRules_1.generalRules.id.optional(),
        commentId: generalRules_1.generalRules.id
    })
};
exports.updateCommentSchema = {
    body: zod_1.default.strictObject({
        content: zod_1.default.string().min(5).max(1000).optional(),
        attachments: zod_1.default.array(generalRules_1.generalRules.file).max(2).optional(),
        tags: zod_1.default.array(generalRules_1.generalRules.id).refine((value) => { return new Set(value).size === value?.length; }, { message: "Duplicated tags" }).optional()
    }).superRefine((data, ctx) => {
        if (!Object.values(data).length)
            ctx.addIssue({ code: "custom", message: "At least one field is required to update post" });
    })
};
