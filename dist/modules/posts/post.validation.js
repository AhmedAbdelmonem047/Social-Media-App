"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePostSchema = exports.getPostSchema = exports.likePostSchema = exports.createPostSchema = exports.ActionType = void 0;
const zod_1 = __importDefault(require("zod"));
const generalRules_1 = require("../../utils/generalRules");
const post_model_1 = require("../../DB/models/post.model");
var ActionType;
(function (ActionType) {
    ActionType["like"] = "like";
    ActionType["unlike"] = "unlike";
})(ActionType || (exports.ActionType = ActionType = {}));
exports.createPostSchema = {
    body: zod_1.default.strictObject({
        content: zod_1.default.string().min(5).max(1000).optional(),
        attachments: zod_1.default.array(generalRules_1.generalRules.file).max(2).optional(),
        allowComment: zod_1.default.enum(post_model_1.AllowCommentEnum).default(post_model_1.AllowCommentEnum.allow).optional,
        availability: zod_1.default.enum(post_model_1.AvailabilityEnum).default(post_model_1.AvailabilityEnum.public).optional,
        tags: zod_1.default.array(generalRules_1.generalRules.id).refine((value) => { return new Set(value).size === value?.length; }, { message: "Duplicated tags" }).optional()
    }).superRefine((data, ctx) => {
        if (!data?.content && !data?.attachments)
            ctx.addIssue({ code: "custom", path: ["content"], message: "Cant't create a post without content nor attachments" });
    })
};
exports.likePostSchema = {
    params: zod_1.default.strictObject({
        postId: generalRules_1.generalRules.id
    }),
    query: zod_1.default.strictObject({
        action: zod_1.default.enum(ActionType).default(ActionType.like)
    })
};
exports.getPostSchema = {
    params: zod_1.default.strictObject({
        postId: generalRules_1.generalRules.id
    }).required()
};
exports.updatePostSchema = {
    body: zod_1.default.strictObject({
        content: zod_1.default.string().min(5).max(1000).optional(),
        attachments: zod_1.default.array(generalRules_1.generalRules.file).max(2).optional(),
        allowComment: zod_1.default.enum(post_model_1.AllowCommentEnum).default(post_model_1.AllowCommentEnum.allow).optional(),
        availability: zod_1.default.enum(post_model_1.AvailabilityEnum).default(post_model_1.AvailabilityEnum.public).optional(),
        tags: zod_1.default.array(generalRules_1.generalRules.id).refine((value) => { return new Set(value).size === value?.length; }, { message: "Duplicated tags" }).optional()
    }).superRefine((data, ctx) => {
        if (!Object.values(data).length)
            ctx.addIssue({ code: "custom", message: "At least one field is required to update post" });
    })
};
