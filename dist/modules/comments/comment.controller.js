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
const express_1 = require("express");
const comment_service_1 = __importDefault(require("./comment.service"));
const validation_1 = require("../../middleware/validation");
const CV = __importStar(require("./comment.validation"));
const authentication_1 = require("../../middleware/authentication");
const multer_cloud_1 = require("../../middleware/multer.cloud");
const commentRouter = (0, express_1.Router)({ mergeParams: true });
commentRouter.post('/', (0, authentication_1.Authentication)(), (0, multer_cloud_1.multerCloud)({ fileTypes: multer_cloud_1.FileTypes.image }).array("attachments", 2), (0, validation_1.Validation)(CV.createCommentSchema), comment_service_1.default.createComment);
commentRouter.get('/', (0, authentication_1.Authentication)(), (0, validation_1.Validation)(CV.getCommentSchema), comment_service_1.default.getCommentById);
commentRouter.get('/withReplies', (0, authentication_1.Authentication)(), (0, validation_1.Validation)(CV.getCommentSchema), comment_service_1.default.getCommentWithReplies);
commentRouter.patch('/update', (0, authentication_1.Authentication)(), (0, multer_cloud_1.multerCloud)({ fileTypes: multer_cloud_1.FileTypes.image }).array("attachments", 2), (0, validation_1.Validation)(CV.updateCommentSchema), comment_service_1.default.updateComment);
commentRouter.patch('/freeze/:postId', (0, authentication_1.Authentication)(), (0, validation_1.Validation)(CV.getCommentSchema), comment_service_1.default.freezeComment);
commentRouter.patch('/unfreeze/:postId', (0, authentication_1.Authentication)(), (0, validation_1.Validation)(CV.getCommentSchema), comment_service_1.default.unfreezeComment);
commentRouter.delete('/delete/:postId', (0, authentication_1.Authentication)(), (0, validation_1.Validation)(CV.getCommentSchema), comment_service_1.default.deleteComment);
exports.default = commentRouter;
