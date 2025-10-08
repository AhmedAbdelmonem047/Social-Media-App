import mongoose, { UpdateQuery } from 'mongoose';
import {  deleteFiles, uploadFiles } from '../../utils/s3.config';
import { NextFunction, Request, Response } from "express";
import { AppError } from "../../utils/classError";
import { v4 as uuidv4 } from 'uuid';
import { PostRepository } from '../../repositories/post.repository';
import postModel, {  IPost } from '../../DB/models/post.model';
import userModel, { RoleType } from '../../DB/models/user.model';
import { UserRepository } from '../../repositories/user.repository';
import { ActionType, likePostQuerySchemaType, likePostSchemaType } from './post.validation';
import { CommentRepository } from '../../repositories/comment.repository';
import commentModel from '../../DB/models/comment.model';
import { AvailabilityQuery, deletePostCascade } from '../../utils/helperFunctions';
import { eventEmitter } from '../../utils/events.js';


class PostService {

    private _userModel = new UserRepository(userModel);
    private _postModel = new PostRepository(postModel);
    private _commentModel = new CommentRepository(commentModel);

    constructor() { }

    // ============= Create Post ============ //
    createPost = async (req: Request, res: Response, next: NextFunction) => {

        if (req.body.tags.length && ((await this._userModel.find({ $in: req?.body?.tags })).length !== req?.body?.tags?.length))
            throw new AppError("Invalid user id", 400);

        const assetFolderId = uuidv4();
        let attachments: string[] = [];
        if (req?.files?.length)
            attachments = await uploadFiles({ files: req.files as unknown as Express.Multer.File[], path: `users/${req.user?._id}/posts/${assetFolderId}` });

        const post = await this._postModel.create({ ...req.body, attachments, assetFolderId, createdBy: req.user?._id });
        if (!post) {
            await deleteFiles({ urls: attachments || [] });
            throw new AppError("Failed to create post", 500);
        }
        if (req.body.tags.length)
            eventEmitter.emit("mentionTags", { postId: post._id, authorId: req.user?._id, tags: req.body.tags });

        return res.status(201).json({ message: "Post created successfully", post });
    }
    // ====================================== //

    // ============= Like Post ============== //
    likePost = async (req: Request, res: Response, next: NextFunction) => {
        const { postId }: likePostSchemaType = req.params as likePostSchemaType;
        const { action }: likePostQuerySchemaType = req.query as likePostQuerySchemaType;

        let updateQuery: UpdateQuery<IPost> = { $addToSet: { likes: req.user?._id } };
        if (action === ActionType.unlike)
            updateQuery = { $pull: { likes: req.user?._id } };

        const post = await this._postModel.findOneAndUpdate({ _id: postId, $or: AvailabilityQuery(req) }, updateQuery, { new: true });
        if (!post)
            throw new AppError(`Failed to ${action || ActionType.like} post`, 400);

        return res.status(201).json({ message: `Post ${action || ActionType.like}` });
    }
    // ====================================== //


    // ============= Update Post ============ //
    updatePost = async (req: Request, res: Response, next: NextFunction) => {
        const { postId }: likePostSchemaType = req.params as likePostSchemaType;

        const post = await this._postModel.findOne({ _id: postId, createdBy: req.user?._id });
        if (!post)
            throw new AppError(`Failed to update post`, 400);

        if (req?.body?.content)
            post.content = req?.body?.content;
        if (req?.body?.availability)
            post.availability = req?.body?.availability;
        if (req?.body?.allowComment)
            post.allowComment = req?.body?.allowComment;
        if (req?.files?.length) {
            await deleteFiles({ urls: post.attachments || [] });
            post.attachments = await uploadFiles({ files: req.files as unknown as Express.Multer.File[], path: `users/${req.user?._id}/posts/${post.assetFolderId}` });
        }
        if (req?.body?.tags?.length) {
            if (req.body.tags.length && (await (await this._userModel).find({ _id: { $in: req?.body?.tags } })).length !== req?.body?.tags?.length)
                throw new AppError("Invalid user id", 400);
            post.tags = req?.body?.tags;
        }

        await post.save();
        return res.status(200).json({ message: "Post updated" });
    }
    // ====================================== //


    // ========= Get Paginated Posts ======== //
    getPaginatedPosts = async (req: Request, res: Response, next: NextFunction) => {

        let { page = 1, limit = 5 } = req.query as unknown as { page: number, limit: number };

        const { docs, currentPage, numOfPages, count } = await this._postModel.getAllPaginated({ filter: {}, query: { page, limit } });
        return res.status(200).json({ message: "Done", docs, currentPage, count, numOfPages });
    }
    // ====================================== //


    // =========== Get Post by ID =========== //
    getPostById = async (req: Request, res: Response, next: NextFunction) => {

        const { postId } = req.params;
        const post = await this._postModel.findById(postId);
        if (!post)
            throw new AppError('Post not found', 404);

        return res.status(200).json({ message: "Done", post });
    }
    // ====================================== //


    // ===== Get All Posts With Comments ==== //
    getPostsWithComments = async (req: Request, res: Response, next: NextFunction) => {

        const posts = this._postModel.find({}, undefined, {
            populate: [{
                path: "comments",
                match: {
                    commentId: { $exists: false }
                },
                populate: [{
                    path: "replies"
                }]
            }]
        });
        return res.status(200).json({ message: "Done", posts });

    }
    // ====================================== //


    // ============= Freeze Post ============ //
    freezePost = async (req: Request, res: Response, next: NextFunction) => {
        const { postId } = req.params;

        const post = await this._postModel.findOne({ _id: postId, deletedAt: { $exists: false } });
        if (!post)
            throw new AppError("Post not found or already freezed", 404);

        if (req.user?.role !== RoleType.admin) {
            if (post.createdBy !== req.user?._id)
                throw new AppError("Unauthorized", 401);
        }

        post.deletedAt = new Date();
        post.deletedBy = req.user?._id;
        if (post.restoredAt)
            post.set({ restoredAt: undefined, restoredBy: undefined });
        await post.save();

        return res.status(200).json({ message: "Post Freezed" });
    }
    // ====================================== //


    // =========== Unfreeze Post ============ //
    unfreezePost = async (req: Request, res: Response, next: NextFunction) => {
        const { postId } = req.params;

        const post = await this._postModel.findOne({ _id: postId, deletedAt: { $exists: true } });
        if (!post)
            throw new AppError("Post not found or already unfreezed", 404);

        if (req.user?.role !== RoleType.admin) {
            if (post.createdBy !== req.user?._id)
                throw new AppError("Unauthorized", 401);
        }

        post.set({ deletedAt: undefined, deletedBy: undefined });
        post.restoredAt = new Date();
        post.restoredBy = req.user?._id;
        await post.save();

        return res.status(200).json({ message: "Post Restored" });
    }
    // ====================================== //


    // ============ Delete Post ============= //
    deletePost = async (req: Request, res: Response, next: NextFunction) => {
        const { postId } = req.params;

        const post = await this._postModel.findOne({ _id: postId, deletedAt: { $exists: true } });
        if (!post)
            throw new AppError("Post not found or post must be freezed first before deletion", 404);

        if ((req.user?.role !== RoleType.admin) || !(req.user?._id.equals(post.createdBy))) {
            if (post.createdBy !== req.user?._id)
                throw new AppError("Unauthorized", 401);
        }

        // const result = await this._postModel.findOneAndDelete({ _id: postId });
        // const comments = await this._commentModel.find({refId: post._id, onModel: onModelEnum.Post});
        // for (const comment of comments) {
        //     const replies = await this._commentModel.deleteMany({refId: comment._id, onModel: onModelEnum.Comment});
        // }
        // await this._commentModel.deleteMany({refId: post._id, onModel: onModelEnum.Post});

        const result = await deletePostCascade(postId as unknown as mongoose.Schema.Types.ObjectId);
        if (!result)
            throw new AppError("Post not found", 404);

        return res.status(200).json({ message: "Post, Comments, and replies deleted successfully" });
    }
    // ====================================== //
}

export default new PostService();