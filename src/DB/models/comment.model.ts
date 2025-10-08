import mongoose, { CallbackError, HydratedDocument, Model, Schema, Types } from "mongoose";

export enum onModelEnum {
    Post = "Post",
    Comment = "Comment"
}

export interface IComment {
    content: string,
    attachments: string[],
    assetFolderId: string,
    createdBy: Types.ObjectId,
    refId: Types.ObjectId,
    onModel: onModelEnum,
    // postId: Types.ObjectId,
    // commentId: Types.ObjectId,
    tags: Types.ObjectId[],
    likes: Types.ObjectId[],
    deletedAt: Date,
    deletedBy: Types.ObjectId
    restoredAt: Date,
    restoredBy: Types.ObjectId
}

// interface ICommentModel extends Model<IComment> {
//     deleteWithReplies(filter: Record<string, any>): Promise<void>;
// }

export const commentSchema = new Schema<IComment>({
    content: { type: String, minLength: 5, maxLength: 1000, required: function () { return this.attachments?.length === 0 } },
    attachments: [String],
    assetFolderId: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    refId: { type: mongoose.Schema.Types.ObjectId, refPath: "onModel", required: true },
    onModel: { type: String, enum: onModelEnum, required: true },
    // postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    // commentId: { type: mongoose.Schema.Types.ObjectId, ref: "Comment" },
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    deletedAt: { type: Date },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    restoredAt: { type: Date },
    restoredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true }, strictQuery: true });

commentSchema.pre(["findOne", "find", "findOneAndUpdate", "findOneAndDelete"], function (next) {
    const query = this.getQuery();
    const { paranoid, ...rest } = query;
    if (paranoid === false)
        this.setQuery({ ...rest });
    else
        this.setQuery({ ...rest, deletedAt: { $exists: false } });
    next();
});

commentSchema.virtual("replies", { ref: "Comment", localField: "_id", foreignField: "refId", justOne: false, match: { onModel: onModelEnum.Comment }, });


// commentSchema.pre("findOneAndDelete", async function (next) {
//     try {
//         const comment = await this.model.findOne(this.getQuery());
//         if (comment) {
//             await (this.model as ICommentModel).deleteWithReplies({ onModel: "Comment", refId: comment._id });
//         }
//         next();
//     } catch (err) {
//         next(err as unknown as CallbackError);
//     }
// });

const commentModel = mongoose.models.Comment || mongoose.model<IComment>("Comment", commentSchema);

export default commentModel;
