import mongoose, { Document } from 'mongoose';
import commentModel, { IComment, onModelEnum } from '../DB/models/comment.model';
import postModel, { AvailabilityEnum, IPost } from '../DB/models/post.model';
import { CommentRepository } from '../repositories/comment.repository';
import { PostRepository } from "../repositories/post.repository";
import { Request } from 'express';

const _postModel = new PostRepository(postModel);
const _commentModel = new CommentRepository(commentModel);

async function deleteCommentWithReplies(commentId: mongoose.Schema.Types.ObjectId) {
  const replies = await _commentModel.find({ refId: commentId, onModel: onModelEnum.Comment });

  for (const reply of replies)
    await deleteCommentWithReplies(reply._id as unknown as mongoose.Schema.Types.ObjectId);

  await _commentModel.deleteMany({ refId: commentId, onModel: onModelEnum.Comment });

  await _commentModel.findByIdAndDelete(commentId);
}

export async function deletePostCascade(postId: mongoose.Schema.Types.ObjectId) {
  const deletedPost = await _postModel.findByIdAndDelete(postId);
  if (!deletedPost)
    return false

  const comments = await _commentModel.find({ refId: postId, onModel: onModelEnum.Post });
  for (const comment of comments)
    await deleteCommentWithReplies(comment._id as unknown as mongoose.Schema.Types.ObjectId);

  await _commentModel.deleteMany({ refId: postId, onModel: onModelEnum.Post });

  return true
}

export async function getPostFromComment(commentId: mongoose.Types.ObjectId): Promise<(Document<unknown, {}, IPost> & IPost) | null> {
  let currentId = new mongoose.Types.ObjectId(commentId);

  while (true) {
    const comment = await _commentModel.findById(currentId, { refId: 1, onModel: 1 }) as (IComment & { _id: mongoose.Types.ObjectId }) | null;
    if (!comment) throw new Error("Comment not found");

    if (comment.onModel === "Post") {
      const post = await _postModel.findById(comment.refId) as (Document<unknown, {}, IPost> & IPost) | null;
      return post;
    }

    currentId = comment.refId as mongoose.Types.ObjectId;
  }
}

export const AvailabilityQuery = (req: Request) => {
  return [
    { availability: AvailabilityEnum.public },
    { availability: AvailabilityEnum.private, createdBy: req.user?._id },
    { availability: AvailabilityEnum.friends, createdBy: { $in: [...req.user?.friends || [], req.user?._id] } }
  ]
}

export async function deleteUserCascade(userId: mongoose.Types.ObjectId) {

  const posts = await _postModel.find({ createdBy: userId });
  for (const post of posts) {
    await deletePostCascade(post._id as unknown as mongoose.Schema.Types.ObjectId);
  }

  const comments = await _commentModel.find({ createdBy: userId });
  for (const comment of comments) {
    await deleteCommentWithReplies(comment._id as unknown as mongoose.Schema.Types.ObjectId);
  }

}