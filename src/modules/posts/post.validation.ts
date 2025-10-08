import z from 'zod'
import { generalRules } from '../../utils/generalRules';
import { AllowCommentEnum, AvailabilityEnum } from '../../DB/models/post.model';

export enum ActionType {
    like = "like",
    unlike = "unlike"
}

export const createPostSchema = {
    body: z.strictObject({
        content: z.string().min(5).max(1000).optional(),
        attachments: z.array(generalRules.file).max(2).optional(),
        allowComment: z.enum(AllowCommentEnum).default(AllowCommentEnum.allow).optional,
        availability: z.enum(AvailabilityEnum).default(AvailabilityEnum.public).optional,
        tags: z.array(generalRules.id).refine((value) => { return new Set(value).size === value?.length }, { message: "Duplicated tags" }).optional()
    }).superRefine((data, ctx) => {
        if (!data?.content && !data?.attachments)
            ctx.addIssue({ code: "custom", path: ["content"], message: "Cant't create a post without content nor attachments" });
    })
}

export const likePostSchema = {
    params: z.strictObject({
        postId: generalRules.id
    }),
    query: z.strictObject({
        action: z.enum(ActionType).default(ActionType.like)
    })
}

export const getPostSchema = {
    params: z.strictObject({
        postId: generalRules.id
    }).required()
}

export const updatePostSchema = {
    body: z.strictObject({
        content: z.string().min(5).max(1000).optional(),
        attachments: z.array(generalRules.file).max(2).optional(),
        allowComment: z.enum(AllowCommentEnum).default(AllowCommentEnum.allow).optional(),
        availability: z.enum(AvailabilityEnum).default(AvailabilityEnum.public).optional(),
        tags: z.array(generalRules.id).refine((value) => { return new Set(value).size === value?.length }, { message: "Duplicated tags" }).optional()
    }).superRefine((data, ctx) => {
        if (!Object.values(data).length)
            ctx.addIssue({ code: "custom", message: "At least one field is required to update post" });
    })
}


export type createPostSchemaType = z.infer<typeof createPostSchema.body>
export type likePostSchemaType = z.infer<typeof likePostSchema.params>
export type likePostQuerySchemaType = z.infer<typeof likePostSchema.query>
