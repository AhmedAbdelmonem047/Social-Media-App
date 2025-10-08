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
exports.AvailabilityQuery = void 0;
exports.deletePostCascade = deletePostCascade;
exports.getPostFromComment = getPostFromComment;
exports.deleteUserCascade = deleteUserCascade;
const mongoose_1 = __importDefault(require("mongoose"));
const comment_model_1 = __importStar(require("../DB/models/comment.model"));
const post_model_1 = __importStar(require("../DB/models/post.model"));
const comment_repository_1 = require("../repositories/comment.repository");
const post_repository_1 = require("../repositories/post.repository");
const _postModel = new post_repository_1.PostRepository(post_model_1.default);
const _commentModel = new comment_repository_1.CommentRepository(comment_model_1.default);
async function deleteCommentWithReplies(commentId) {
    const replies = await _commentModel.find({ refId: commentId, onModel: comment_model_1.onModelEnum.Comment });
    for (const reply of replies)
        await deleteCommentWithReplies(reply._id);
    await _commentModel.deleteMany({ refId: commentId, onModel: comment_model_1.onModelEnum.Comment });
    await _commentModel.findByIdAndDelete(commentId);
}
async function deletePostCascade(postId) {
    const deletedPost = await _postModel.findByIdAndDelete(postId);
    if (!deletedPost)
        return false;
    const comments = await _commentModel.find({ refId: postId, onModel: comment_model_1.onModelEnum.Post });
    for (const comment of comments)
        await deleteCommentWithReplies(comment._id);
    await _commentModel.deleteMany({ refId: postId, onModel: comment_model_1.onModelEnum.Post });
    return true;
}
async function getPostFromComment(commentId) {
    let currentId = new mongoose_1.default.Types.ObjectId(commentId);
    while (true) {
        const comment = await _commentModel.findById(currentId, { refId: 1, onModel: 1 });
        if (!comment)
            throw new Error("Comment not found");
        if (comment.onModel === "Post") {
            const post = await _postModel.findById(comment.refId);
            return post;
        }
        currentId = comment.refId;
    }
}
const AvailabilityQuery = (req) => {
    return [
        { availability: post_model_1.AvailabilityEnum.public },
        { availability: post_model_1.AvailabilityEnum.private, createdBy: req.user?._id },
        { availability: post_model_1.AvailabilityEnum.friends, createdBy: { $in: [...req.user?.friends || [], req.user?._id] } }
    ];
};
exports.AvailabilityQuery = AvailabilityQuery;
async function deleteUserCascade(userId) {
    const posts = await _postModel.find({ createdBy: userId });
    for (const post of posts) {
        await deletePostCascade(post._id);
    }
    const comments = await _commentModel.find({ createdBy: userId });
    for (const comment of comments) {
        await deleteCommentWithReplies(comment._id);
    }
}
