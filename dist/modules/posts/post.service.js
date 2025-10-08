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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const s3_config_1 = require("../../utils/s3.config");
const classError_1 = require("../../utils/classError");
const uuid_1 = require("uuid");
const post_repository_1 = require("../../repositories/post.repository");
const post_model_1 = __importDefault(require("../../DB/models/post.model"));
const user_model_1 = __importStar(require("../../DB/models/user.model"));
const user_repository_1 = require("../../repositories/user.repository");
const post_validation_1 = require("./post.validation");
const comment_repository_1 = require("../../repositories/comment.repository");
const comment_model_1 = __importDefault(require("../../DB/models/comment.model"));
const helperFunctions_1 = require("../../utils/helperFunctions");
const events_js_1 = require("../../utils/events.js");
class PostService {
    _userModel = new user_repository_1.UserRepository(user_model_1.default);
    _postModel = new post_repository_1.PostRepository(post_model_1.default);
    _commentModel = new comment_repository_1.CommentRepository(comment_model_1.default);
    constructor() { }
    createPost = async (req, res, next) => {
        if (req.body.tags.length && ((await this._userModel.find({ $in: req?.body?.tags })).length !== req?.body?.tags?.length))
            throw new classError_1.AppError("Invalid user id", 400);
        const assetFolderId = (0, uuid_1.v4)();
        let attachments = [];
        if (req?.files?.length)
            attachments = await (0, s3_config_1.uploadFiles)({ files: req.files, path: `users/${req.user?._id}/posts/${assetFolderId}` });
        const post = await this._postModel.create({ ...req.body, attachments, assetFolderId, createdBy: req.user?._id });
        if (!post) {
            await (0, s3_config_1.deleteFiles)({ urls: attachments || [] });
            throw new classError_1.AppError("Failed to create post", 500);
        }
        if (req.body.tags.length)
            events_js_1.eventEmitter.emit("mentionTags", { postId: post._id, authorId: req.user?._id, tags: req.body.tags });
        return res.status(201).json({ message: "Post created successfully", post });
    };
    likePost = async (req, res, next) => {
        const { postId } = req.params;
        const { action } = req.query;
        let updateQuery = { $addToSet: { likes: req.user?._id } };
        if (action === post_validation_1.ActionType.unlike)
            updateQuery = { $pull: { likes: req.user?._id } };
        const post = await this._postModel.findOneAndUpdate({ _id: postId, $or: (0, helperFunctions_1.AvailabilityQuery)(req) }, updateQuery, { new: true });
        if (!post)
            throw new classError_1.AppError(`Failed to ${action || post_validation_1.ActionType.like} post`, 400);
        return res.status(201).json({ message: `Post ${action || post_validation_1.ActionType.like}` });
    };
    updatePost = async (req, res, next) => {
        const { postId } = req.params;
        const post = await this._postModel.findOne({ _id: postId, createdBy: req.user?._id });
        if (!post)
            throw new classError_1.AppError(`Failed to update post`, 400);
        if (req?.body?.content)
            post.content = req?.body?.content;
        if (req?.body?.availability)
            post.availability = req?.body?.availability;
        if (req?.body?.allowComment)
            post.allowComment = req?.body?.allowComment;
        if (req?.files?.length) {
            await (0, s3_config_1.deleteFiles)({ urls: post.attachments || [] });
            post.attachments = await (0, s3_config_1.uploadFiles)({ files: req.files, path: `users/${req.user?._id}/posts/${post.assetFolderId}` });
        }
        if (req?.body?.tags?.length) {
            if (req.body.tags.length && (await (await this._userModel).find({ _id: { $in: req?.body?.tags } })).length !== req?.body?.tags?.length)
                throw new classError_1.AppError("Invalid user id", 400);
            post.tags = req?.body?.tags;
        }
        await post.save();
        return res.status(200).json({ message: "Post updated" });
    };
    getPaginatedPosts = async (req, res, next) => {
        let { page = 1, limit = 5 } = req.query;
        const { docs, currentPage, numOfPages, count } = await this._postModel.getAllPaginated({ filter: {}, query: { page, limit } });
        return res.status(200).json({ message: "Done", docs, currentPage, count, numOfPages });
    };
    getPostById = async (req, res, next) => {
        const { postId } = req.params;
        const post = await this._postModel.findById(postId);
        if (!post)
            throw new classError_1.AppError('Post not found', 404);
        return res.status(200).json({ message: "Done", post });
    };
    getPostsWithComments = async (req, res, next) => {
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
    };
    freezePost = async (req, res, next) => {
        const { postId } = req.params;
        const post = await this._postModel.findOne({ _id: postId, deletedAt: { $exists: false } });
        if (!post)
            throw new classError_1.AppError("Post not found or already freezed", 404);
        if (req.user?.role !== user_model_1.RoleType.admin) {
            if (post.createdBy !== req.user?._id)
                throw new classError_1.AppError("Unauthorized", 401);
        }
        post.deletedAt = new Date();
        post.deletedBy = req.user?._id;
        if (post.restoredAt)
            post.set({ restoredAt: undefined, restoredBy: undefined });
        await post.save();
        return res.status(200).json({ message: "Post Freezed" });
    };
    unfreezePost = async (req, res, next) => {
        const { postId } = req.params;
        const post = await this._postModel.findOne({ _id: postId, deletedAt: { $exists: true } });
        if (!post)
            throw new classError_1.AppError("Post not found or already unfreezed", 404);
        if (req.user?.role !== user_model_1.RoleType.admin) {
            if (post.createdBy !== req.user?._id)
                throw new classError_1.AppError("Unauthorized", 401);
        }
        post.set({ deletedAt: undefined, deletedBy: undefined });
        post.restoredAt = new Date();
        post.restoredBy = req.user?._id;
        await post.save();
        return res.status(200).json({ message: "Post Restored" });
    };
    deletePost = async (req, res, next) => {
        const { postId } = req.params;
        const post = await this._postModel.findOne({ _id: postId, deletedAt: { $exists: true } });
        if (!post)
            throw new classError_1.AppError("Post not found or post must be freezed first before deletion", 404);
        if ((req.user?.role !== user_model_1.RoleType.admin) || !(req.user?._id.equals(post.createdBy))) {
            if (post.createdBy !== req.user?._id)
                throw new classError_1.AppError("Unauthorized", 401);
        }
        const result = await (0, helperFunctions_1.deletePostCascade)(postId);
        if (!result)
            throw new classError_1.AppError("Post not found", 404);
        return res.status(200).json({ message: "Post, Comments, and replies deleted successfully" });
    };
}
exports.default = new PostService();
