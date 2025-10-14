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
const user_service_1 = __importDefault(require("./user.service"));
const validation_1 = require("../../middleware/validation");
const UV = __importStar(require("./user.validation"));
const authentication_1 = require("../../middleware/authentication");
const token_1 = require("../../utils/token");
const multer_cloud_1 = require("../../middleware/multer.cloud");
const user_model_js_1 = require("../../DB/models/user.model.js");
const chat_controller_js_1 = __importDefault(require("../chat/chat.controller.js"));
const userRouter = (0, express_1.Router)();
userRouter.use("/:userId/chat", chat_controller_js_1.default);
userRouter.post('/signup', (0, validation_1.Validation)(UV.signupSchema), user_service_1.default.signup);
userRouter.patch('/confirmEmail', (0, validation_1.Validation)(UV.confirmEmailSchema), user_service_1.default.confirmEmail);
userRouter.post('/login', (0, validation_1.Validation)(UV.loginSchema), user_service_1.default.login);
userRouter.post('/loginWithGmail', (0, validation_1.Validation)(UV.loginWithGmailSchema), user_service_1.default.loginWithGmail);
userRouter.get('/profile', (0, authentication_1.Authentication)(), user_service_1.default.getProfile);
userRouter.post('/logout', (0, authentication_1.Authentication)(), (0, validation_1.Validation)(UV.logoutSchema), user_service_1.default.logout);
userRouter.get('/refreshToken', (0, authentication_1.Authentication)(token_1.TokenType.refresh), user_service_1.default.refreshToken);
userRouter.patch('/forgetPassword', (0, authentication_1.Authentication)(), (0, validation_1.Validation)(UV.forgetPasswordSchema), user_service_1.default.forgetPassword);
userRouter.patch('/resetPassword', (0, authentication_1.Authentication)(), (0, validation_1.Validation)(UV.resetPasswordSchema), user_service_1.default.resetPassword);
userRouter.post('/upload', (0, authentication_1.Authentication)(), (0, multer_cloud_1.multerCloud)({ fileTypes: multer_cloud_1.FileTypes.image }).single("file"), user_service_1.default.uploadImageWithPresignedURL);
userRouter.post('/uploadFiles', (0, authentication_1.Authentication)(), (0, multer_cloud_1.multerCloud)({ fileTypes: multer_cloud_1.FileTypes.image }).array("files"), user_service_1.default.uploadImages);
userRouter.patch('/freeze{/:userId}', (0, authentication_1.Authentication)(), (0, validation_1.Validation)(UV.freezeAccountSchema), user_service_1.default.freezeAccount);
userRouter.patch('/unfreeze{/:userId}', (0, authentication_1.Authentication)(), (0, validation_1.Validation)(UV.freezeAccountSchema), user_service_1.default.unfreezeAccount);
userRouter.delete('/delete/:userId', (0, authentication_1.Authentication)(), (0, authentication_1.Authorization)({ accessRoles: [user_model_js_1.RoleType.admin] }), (0, validation_1.Validation)(UV.deleteAccountSchema), user_service_1.default.deleteAccount);
userRouter.patch('/sendRequest/:userId', (0, authentication_1.Authentication)(), (0, validation_1.Validation)(UV.freezeAccountSchema), user_service_1.default.sendFriendRequest);
userRouter.patch('/acceptDelete/:requestId/:action', (0, authentication_1.Authentication)(), (0, validation_1.Validation)(UV.acceptDeleteSchema), user_service_1.default.acceptOrDeleteFriendRequest);
userRouter.patch('/unfriend/:userId', (0, authentication_1.Authentication)(), (0, validation_1.Validation)(UV.deleteAccountSchema), user_service_1.default.unfriend);
userRouter.patch('/block/:userId', (0, authentication_1.Authentication)(), (0, validation_1.Validation)(UV.deleteAccountSchema), user_service_1.default.blockUser);
userRouter.patch('/unblock/:userId', (0, authentication_1.Authentication)(), (0, validation_1.Validation)(UV.deleteAccountSchema), user_service_1.default.unblockUser);
exports.default = userRouter;
