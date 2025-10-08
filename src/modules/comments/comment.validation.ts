import z from 'zod'
import { generalRules } from '../../utils/generalRules';
import { onModelEnum } from '../../DB/models/comment.model.js';


export const createCommentSchema = {
    params: z.strictObject({
        postId: generalRules.id,
        commentId: generalRules.id.optional()
    }),
    body: z.strictObject({
        content: z.string().min(5).max(1000).optional(),
        attachments: z.array(generalRules.file).max(2).optional(),
        tags: z.array(generalRules.id).refine((value) => { return new Set(value).size === value?.length }, { message: "Duplicated tags" }).optional(),
        onModel: z.enum(onModelEnum)
    }).superRefine((data, ctx) => {
        if (!data?.content && !data?.attachments)
            ctx.addIssue({ code: "custom", path: ["content"], message: "Cant't create a Comment without content nor attachments" });
    })
}

export const getCommentSchema = {
    params: z.strictObject({
        postId: generalRules.id.optional(),
        commentId: generalRules.id
    })
}


export const updateCommentSchema = {
    body: z.strictObject({
        content: z.string().min(5).max(1000).optional(),
        attachments: z.array(generalRules.file).max(2).optional(),
        tags: z.array(generalRules.id).refine((value) => { return new Set(value).size === value?.length }, { message: "Duplicated tags" }).optional()
    }).superRefine((data, ctx) => {
        if (!Object.values(data).length)
            ctx.addIssue({ code: "custom", message: "At least one field is required to update post" });
    })
}




export type createCommentSchemaType = z.infer<typeof createCommentSchema.body>
