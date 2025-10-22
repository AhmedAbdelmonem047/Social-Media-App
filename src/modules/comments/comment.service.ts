import { HydratedDocument, Types } from 'mongoose';
import { deleteFiles, uploadFiles } from '../../utils/s3.config';
import { NextFunction, Request, Response } from "express";
import { AppError } from "../../utils/classError";
import { v4 as uuidv4 } from 'uuid';
import { PostRepository } from '../../repositories/post.repository';
import postModel, { AllowCommentEnum, IPost } from '../../DB/models/post.model';
import userModel, { IUser, RoleType } from '../../DB/models/user.model';
import { UserRepository } from '../../repositories/user.repository';
import { CommentRepository } from '../../repositories/comment.repository';
import commentModel, { IComment, onModelEnum } from '../../DB/models/comment.model';
import { AvailabilityQuery } from '../../utils/helperFunctions';
import mongoose from 'mongoose';
import { deletePostCascade, getPostFromComment } from '../../utils/helperFunctions';



class CommentService {

    private _postModel = new PostRepository(postModel);
    private _userModel = new UserRepository(userModel);
    private _commentModel = new CommentRepository(commentModel);
    constructor() { }

    // ======== Create Comment Or Reply ====== //
    createComment = async (req: Request, res: Response, next: NextFunction) => {

        const { postId, commentId } = req.params;
        let { content, tags, attachments, onModel } = req.body;

        let doc: HydratedDocument<IPost | IComment> | null = null;
        if (onModel === onModelEnum.Comment) {
            if (!commentId)
                throw new AppError("commentId is required when creating a reply", 400);

            const comment = await this._commentModel.findOne(
                { _id: commentId, refId: postId }, undefined,
                {
                    populate: [{
                        path: "refId",
                        match: { allowComment: AllowCommentEnum.allow, $or: AvailabilityQuery(req?.user as HydratedDocument<IUser>) }
                    }]
                });

            if (!comment?.refId)
                throw new AppError("Comment not found or you're not authorized", 400);
            doc = comment;
        } else if (onModel === onModelEnum.Post) {
            if (commentId)
                throw new AppError("onModel must be Comment to create reply", 400);

            const post = await this._postModel.findOne({ _id: postId, allowComment: AllowCommentEnum.allow, $or: AvailabilityQuery(req?.user as HydratedDocument<IUser>) });
            if (!post)
                throw new AppError("Post not found or you're not authorized", 400);
            doc = post;
        }

        if (tags?.length && ((await this._userModel.find({ $in: tags })).length !== tags?.length))
            throw new AppError("Invalid user id", 400);

        const assetFolderId = uuidv4();
        if (attachments?.length)
            attachments = await uploadFiles({ files: req.files as Express.Multer.File[], path: `users/${doc?.createdBy}/posts/${doc?.assetFolderId}/comment/${assetFolderId}` });

        const comment = await this._commentModel.create({ content, tags, attachments, assetFolderId, refId: doc?._id as Types.ObjectId, onModel, createdBy: req?.user?._id as Types.ObjectId });
        if (!comment) {
            await deleteFiles({ urls: attachments || [] });
            throw new AppError("Failed to create comment", 500);
        }

        return res.status(201).json({ message: "Comment created successfully", comment });
    }
    // ====================================== //


    // ============ Update Comment ========== //
    updateComment = async (req: Request, res: Response, next: NextFunction) => {
        const { commentId } = req.params;

        const comment = await this._commentModel.findOne({ _id: commentId, createdBy: req.user?._id });
        if (!comment)
            throw new AppError(`Failed to update comment`, 400);
        const post = await getPostFromComment(comment._id);

        if (req?.body?.content)
            comment.content = req?.body?.content;
        if (req?.files?.length) {
            await deleteFiles({ urls: comment.attachments || [] });
            comment.attachments = await uploadFiles({ files: req.files as unknown as Express.Multer.File[], path: `users/${req.user?._id}/posts/${post!.assetFolderId}/comments/${comment.assetFolderId}` });
        }
        if (req?.body?.tags?.length) {
            if (req.body.tags.length && (await this._userModel.find({ _id: { $in: req?.body?.tags } })).length !== req?.body?.tags?.length)
                throw new AppError("Invalid user id", 400);
            comment.tags = req?.body?.tags;
        }

        await comment.save();
        return res.status(200).json({ message: "Comment updated" });
    }
    // ====================================== //


    // ========== Get Comment by ID ========= //
    getCommentById = async (req: Request, res: Response, next: NextFunction) => {

        const { commentId } = req.params;
        const comment = await this._commentModel.findById(commentId);
        if (!comment)
            throw new AppError('Comment not found', 404);

        return res.status(200).json({ message: "Done", comment });
    }
    // ====================================== //


    // ====== Get Comment With Replies ====== //
    getCommentWithReplies = async (req: Request, res: Response, next: NextFunction) => {

        const { commentId } = req.params;
        const comment = this._commentModel.find({ _id: commentId }, undefined, { populate: [{ path: "replies", }] });
        if (!comment)
            throw new AppError('Comment not found', 404);

        return res.status(200).json({ message: "Done", comment });
    }
    // ====================================== //


    // =========== Freeze Comment =========== //
    freezeComment = async (req: Request, res: Response, next: NextFunction) => {
        const { commentId } = req.params;

        const comment = await this._commentModel.findOne({ _id: commentId, deletedAt: { $exists: false } });
        if (!comment)
            throw new AppError("Comment not found or already freezed", 404);

        if (req.user?.role !== RoleType.admin) {
            if (comment.createdBy !== req.user?._id)
                throw new AppError("Unauthorized", 401);
        }

        comment.deletedAt = new Date();
        comment.deletedBy = req.user?._id;
        if (comment.restoredAt)
            comment.set({ restoredAt: undefined, restoredBy: undefined });
        await comment.save();

        return res.status(200).json({ message: "Comment Freezed" });
    }
    // ====================================== //


    // ========== Unfreeze Comment ========== //
    unfreezeComment = async (req: Request, res: Response, next: NextFunction) => {
        const { commentId } = req.params;

        const comment = await this._commentModel.findOne({ _id: commentId, deletedAt: { $exists: true } });
        if (!comment)
            throw new AppError("Comment not found or already unfreezed", 404);

        if (req.user?.role !== RoleType.admin) {
            if (comment.createdBy !== req.user?._id)
                throw new AppError("Unauthorized", 401);
        }

        comment.set({ deletedAt: undefined, deletedBy: undefined });
        comment.restoredAt = new Date();
        comment.restoredBy = req.user?._id;
        await comment.save();

        return res.status(200).json({ message: "Comment Restored" });
    }
    // ====================================== //


    // ========== Delete Comment ============ //
    deleteComment = async (req: Request, res: Response, next: NextFunction) => {
        const { commentId } = req.params;

        const comment = await this._commentModel.findOne({ _id: commentId, deletedAt: { $exists: true } });
        if (!comment)
            throw new AppError("Comment not found or comment must be freezed first before deletion", 404);

        if ((req.user?.role !== RoleType.admin) || !(req.user?._id.equals(comment.createdBy))) {
            if (comment.createdBy !== req.user?._id)
                throw new AppError("Unauthorized", 401);
        }

        const result = await deletePostCascade(commentId as unknown as mongoose.Schema.Types.ObjectId);
        if (!result)
            throw new AppError("Comment not found", 404);

        return res.status(200).json({ message: "Comments and replies deleted successfully" });
    }
    // ====================================== //
}

export default new CommentService();