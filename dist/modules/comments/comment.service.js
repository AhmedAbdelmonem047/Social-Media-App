"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const s3_config_1 = require("../../utils/s3.config");
const classError_1 = require("../../utils/classError");
const uuid_1 = require("uuid");
const post_repository_1 = require("../../repositories/post.repository");
const post_model_1 = __importStar(require("../../DB/models/post.model"));
const user_model_1 = __importStar(require("../../DB/models/user.model"));
const user_repository_1 = require("../../repositories/user.repository");
const comment_repository_1 = require("../../repositories/comment.repository");
const comment_model_1 = __importStar(require("../../DB/models/comment.model"));
const helperFunctions_1 = require("../../utils/helperFunctions");
const helperFunctions_2 = require("../../utils/helperFunctions");
class CommentService {
    _postModel = new post_repository_1.PostRepository(post_model_1.default);
    _userModel = new user_repository_1.UserRepository(user_model_1.default);
    _commentModel = new comment_repository_1.CommentRepository(comment_model_1.default);
    constructor() { }
    createComment = async (req, res, next) => {
        const { postId, commentId } = req.params;
        let { content, tags, attachments, onModel } = req.body;
        let doc = null;
        if (onModel === comment_model_1.onModelEnum.Comment) {
            if (!commentId)
                throw new classError_1.AppError("commentId is required when creating a reply", 400);
            const comment = await this._commentModel.findOne({ _id: commentId, refId: postId }, undefined, {
                populate: [{
                        path: "refId",
                        match: { allowComment: post_model_1.AllowCommentEnum.allow, $or: (0, helperFunctions_1.AvailabilityQuery)(req?.user) }
                    }]
            });
            if (!comment?.refId)
                throw new classError_1.AppError("Comment not found or you're not authorized", 400);
            doc = comment;
        }
        else if (onModel === comment_model_1.onModelEnum.Post) {
            if (commentId)
                throw new classError_1.AppError("onModel must be Comment to create reply", 400);
            const post = await this._postModel.findOne({ _id: postId, allowComment: post_model_1.AllowCommentEnum.allow, $or: (0, helperFunctions_1.AvailabilityQuery)(req?.user) });
            if (!post)
                throw new classError_1.AppError("Post not found or you're not authorized", 400);
            doc = post;
        }
        if (tags?.length && ((await this._userModel.find({ $in: tags })).length !== tags?.length))
            throw new classError_1.AppError("Invalid user id", 400);
        const assetFolderId = (0, uuid_1.v4)();
        if (attachments?.length)
            attachments = await (0, s3_config_1.uploadFiles)({ files: req.files, path: `users/${doc?.createdBy}/posts/${doc?.assetFolderId}/comment/${assetFolderId}` });
        const comment = await this._commentModel.create({ content, tags, attachments, assetFolderId, refId: doc?._id, onModel, createdBy: req?.user?._id });
        if (!comment) {
            await (0, s3_config_1.deleteFiles)({ urls: attachments || [] });
            throw new classError_1.AppError("Failed to create comment", 500);
        }
        return res.status(201).json({ message: "Comment created successfully", comment });
    };
    updateComment = async (req, res, next) => {
        const { commentId } = req.params;
        const comment = await this._commentModel.findOne({ _id: commentId, createdBy: req.user?._id });
        if (!comment)
            throw new classError_1.AppError(`Failed to update comment`, 400);
        const post = await (0, helperFunctions_2.getPostFromComment)(comment._id);
        if (req?.body?.content)
            comment.content = req?.body?.content;
        if (req?.files?.length) {
            await (0, s3_config_1.deleteFiles)({ urls: comment.attachments || [] });
            comment.attachments = await (0, s3_config_1.uploadFiles)({ files: req.files, path: `users/${req.user?._id}/posts/${post.assetFolderId}/comments/${comment.assetFolderId}` });
        }
        if (req?.body?.tags?.length) {
            if (req.body.tags.length && (await this._userModel.find({ _id: { $in: req?.body?.tags } })).length !== req?.body?.tags?.length)
                throw new classError_1.AppError("Invalid user id", 400);
            comment.tags = req?.body?.tags;
        }
        await comment.save();
        return res.status(200).json({ message: "Comment updated" });
    };
    getCommentById = async (req, res, next) => {
        const { commentId } = req.params;
        const comment = await this._commentModel.findById(commentId);
        if (!comment)
            throw new classError_1.AppError('Comment not found', 404);
        return res.status(200).json({ message: "Done", comment });
    };
    getCommentWithReplies = async (req, res, next) => {
        const { commentId } = req.params;
        const comment = this._commentModel.find({ _id: commentId }, undefined, { populate: [{ path: "replies", }] });
        if (!comment)
            throw new classError_1.AppError('Comment not found', 404);
        return res.status(200).json({ message: "Done", comment });
    };
    freezeComment = async (req, res, next) => {
        const { commentId } = req.params;
        const comment = await this._commentModel.findOne({ _id: commentId, deletedAt: { $exists: false } });
        if (!comment)
            throw new classError_1.AppError("Comment not found or already freezed", 404);
        if (req.user?.role !== user_model_1.RoleType.admin) {
            if (comment.createdBy !== req.user?._id)
                throw new classError_1.AppError("Unauthorized", 401);
        }
        comment.deletedAt = new Date();
        comment.deletedBy = req.user?._id;
        if (comment.restoredAt)
            comment.set({ restoredAt: undefined, restoredBy: undefined });
        await comment.save();
        return res.status(200).json({ message: "Comment Freezed" });
    };
    unfreezeComment = async (req, res, next) => {
        const { commentId } = req.params;
        const comment = await this._commentModel.findOne({ _id: commentId, deletedAt: { $exists: true } });
        if (!comment)
            throw new classError_1.AppError("Comment not found or already unfreezed", 404);
        if (req.user?.role !== user_model_1.RoleType.admin) {
            if (comment.createdBy !== req.user?._id)
                throw new classError_1.AppError("Unauthorized", 401);
        }
        comment.set({ deletedAt: undefined, deletedBy: undefined });
        comment.restoredAt = new Date();
        comment.restoredBy = req.user?._id;
        await comment.save();
        return res.status(200).json({ message: "Comment Restored" });
    };
    deleteComment = async (req, res, next) => {
        const { commentId } = req.params;
        const comment = await this._commentModel.findOne({ _id: commentId, deletedAt: { $exists: true } });
        if (!comment)
            throw new classError_1.AppError("Comment not found or comment must be freezed first before deletion", 404);
        if ((req.user?.role !== user_model_1.RoleType.admin) || !(req.user?._id.equals(comment.createdBy))) {
            if (comment.createdBy !== req.user?._id)
                throw new classError_1.AppError("Unauthorized", 401);
        }
        const result = await (0, helperFunctions_2.deletePostCascade)(commentId);
        if (!result)
            throw new classError_1.AppError("Comment not found", 404);
        return res.status(200).json({ message: "Comments and replies deleted successfully" });
    };
}
exports.default = new CommentService();
