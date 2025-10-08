import mongoose, { CallbackError, Schema, Types, model, models } from "mongoose";
import { CommentRepository } from "../../repositories/comment.repository";
import commentModel, { onModelEnum } from "./comment.model";

const _commentModel = new CommentRepository(commentModel);

export enum AllowCommentEnum {
  allow = "allow",
  deny = "deny"
}

export enum AvailabilityEnum {
  public = "public",
  private = "private",
  friends = "friends"
}


export interface IPost {
  content: string,
  attachments: string[],
  assetFolderId: string,
  createdBy: Types.ObjectId,
  tags: Types.ObjectId[],
  likes: Types.ObjectId[],
  allowComment: AllowCommentEnum,
  availability: AvailabilityEnum,
  deletedAt: Date,
  deletedBy: Types.ObjectId
  restoredAt: Date,
  restoredBy: Types.ObjectId
}

export const postSchema = new Schema<IPost>({
  content: { type: String, minLength: 5, maxLength: 1000, required: function () { return this.attachments?.length === 0 } },
  attachments: [String],
  assetFolderId: String,
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  allowComment: { type: String, enum: AllowCommentEnum, default: AllowCommentEnum.allow },
  availability: { type: String, enum: AvailabilityEnum, default: AvailabilityEnum.public },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  restoredAt: { type: Date },
  restoredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true }, strictQuery: true });

postSchema.pre(["findOne", "find"], function (next) {
  const query = this.getQuery();
  const { paranoid, ...rest } = query;
  if (paranoid === false)
    this.setQuery({ ...rest });
  else
    this.setQuery({ ...rest, deletedAt: { $exists: false } });
  next();
});

// postSchema.pre("findOneAndDelete", async function (next) {
//   try {
//     const post = await this.model.findOne(this.getQuery());
//     if (post) {
//       await _commentModel.deleteWithReplies({ onModel: "Post", refId: post._id });
//     }
//     next();
//   } catch (err) {
//     next(err as unknown as CallbackError);
//   }
// });

postSchema.virtual("comments", { ref: "Comment", localField: "_id", foreignField: "refId", justOne: false, match: { onModel: onModelEnum.Post } });

const postModel = models.Post || model<IPost>("Post", postSchema);

export default postModel;
