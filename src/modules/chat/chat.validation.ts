import z from "zod";
import { generalRules } from "../../utils/generalRules.js";


export const getChatSchema = {
    params: z.strictObject({
        userId: generalRules.id,
    }),
}

export const sendMessageSchema = {
    body:z.strictObject({
        content: [String],
        sendTo: generalRules.id
    })
}