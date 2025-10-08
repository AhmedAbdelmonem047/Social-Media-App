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
exports.postSchema = exports.AvailabilityEnum = exports.AllowCommentEnum = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const comment_repository_1 = require("../../repositories/comment.repository");
const comment_model_1 = __importStar(require("./comment.model"));
const _commentModel = new comment_repository_1.CommentRepository(comment_model_1.default);
var AllowCommentEnum;
(function (AllowCommentEnum) {
    AllowCommentEnum["allow"] = "allow";
    AllowCommentEnum["deny"] = "deny";
})(AllowCommentEnum || (exports.AllowCommentEnum = AllowCommentEnum = {}));
var AvailabilityEnum;
(function (AvailabilityEnum) {
    AvailabilityEnum["public"] = "public";
    AvailabilityEnum["private"] = "private";
    AvailabilityEnum["friends"] = "friends";
})(AvailabilityEnum || (exports.AvailabilityEnum = AvailabilityEnum = {}));
exports.postSchema = new mongoose_1.Schema({
    content: { type: String, minLength: 5, maxLength: 1000, required: function () { return this.attachments?.length === 0; } },
    attachments: [String],
    assetFolderId: String,
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    tags: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" }],
    likes: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" }],
    allowComment: { type: String, enum: AllowCommentEnum, default: AllowCommentEnum.allow },
    availability: { type: String, enum: AvailabilityEnum, default: AvailabilityEnum.public },
    deletedAt: { type: Date },
    deletedBy: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" },
    restoredAt: { type: Date },
    restoredBy: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true }, strictQuery: true });
exports.postSchema.pre(["findOne", "find"], function (next) {
    const query = this.getQuery();
    const { paranoid, ...rest } = query;
    if (paranoid === false)
        this.setQuery({ ...rest });
    else
        this.setQuery({ ...rest, deletedAt: { $exists: false } });
    next();
});
exports.postSchema.virtual("comments", { ref: "Comment", localField: "_id", foreignField: "refId", justOne: false, match: { onModel: comment_model_1.onModelEnum.Post } });
const postModel = mongoose_1.models.Post || (0, mongoose_1.model)("Post", exports.postSchema);
exports.default = postModel;
