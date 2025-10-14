import  { Types, Schema, model, models } from "mongoose";


export interface IMessage {
    content: string,
    createdBy: Types.ObjectId,
    createdAt?: Date,
    updatedAt?: Date,
}

export interface IChat {
    participants?: Types.ObjectId[],
    createdBy: Types.ObjectId,
    messages: IMessage[],
    group?: string,
    groupImg?: string,
    roomId?: string,
    createdAt: Date,
    updatedAt: Date,
}

const messageSchema = new Schema<IMessage>({
    content: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

const chatSchema = new Schema<IChat>({
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    messages: [messageSchema],
    group: { type: String },
    groupImg: { type: String },
    roomId: { type: String }
}, { timestamps: true });

const chatModel = models.Chat || model<IChat>("Chat", chatSchema);
export default chatModel;