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
const s3_config_1 = require("./../../utils/s3.config");
const user_model_1 = __importStar(require("../../DB/models/user.model"));
const user_repository_1 = require("../../repositories/user.repository");
const classError_1 = require("../../utils/classError");
const hash_1 = require("../../utils/hash");
const sendEmail_1 = require("../../services/sendEmail");
const events_1 = require("../../utils/events");
const uuid_1 = require("uuid");
const token_1 = require("../../utils/token");
const revokeToken_repository_1 = require("../../repositories/revokeToken.repository");
const revokeToken_model_1 = __importDefault(require("../../DB/models/revokeToken.model"));
const google_auth_library_1 = require("google-auth-library");
const s3_config_2 = require("../../utils/s3.config");
const helperFunctions_1 = require("../../utils/helperFunctions");
const friendRequest_repository_1 = require("../../repositories/friendRequest.repository");
const friendRequest_model_1 = __importStar(require("../../DB/models/friendRequest.model"));
class UserService {
    _userModel = new user_repository_1.UserRepository(user_model_1.default);
    _revokeTokenModel = new revokeToken_repository_1.RevokeTokenRepository(revokeToken_model_1.default);
    _friendRequestModel = new friendRequest_repository_1.FriendRequestRepository(friendRequest_model_1.default);
    constructor() { }
    signup = async (req, res, next) => {
        const { userName, email, password, age, address, phone, gender } = req.body;
        if (await this._userModel.findOne({ email }))
            throw new classError_1.AppError("Email already exists", 409);
        const otp = await (0, sendEmail_1.generateOTP)();
        const hashedOTP = await (0, hash_1.Hash)(String(otp));
        events_1.eventEmitter.emit("confirmEmail", { email, otp });
        const hashedPassword = await (0, hash_1.Hash)(password);
        const user = await this._userModel.createOneUser({ userName, email, password: hashedPassword, age, address, phone, gender, otp: hashedOTP });
        return res.status(201).json({ message: "User created successfully", user });
    };
    confirmEmail = async (req, res, next) => {
        const { email, otp } = req.body;
        const user = await this._userModel.findOne({ email, isConfirmed: { $exists: false } });
        if (!user)
            throw new classError_1.AppError("User not found or already confirmed", 404);
        if (!await (0, hash_1.Compare)(otp, user?.otp))
            throw new classError_1.AppError("Inalid OTP", 400);
        this._userModel.updateOne({ email: user?.email }, { isConfirmed: true, $unset: { otp: "" } });
        return res.status(200).json({ message: "Email confirmed" });
    };
    login = async (req, res, next) => {
        const { email, password } = req.body;
        const user = await this._userModel.findOne({ email, isConfirmed: true, provider: user_model_1.ProviderType.system });
        if (!user)
            throw new classError_1.AppError("User not found or not confirmed yet or invalid provider", 404);
        if (!await (0, hash_1.Compare)(password, user?.password))
            throw new classError_1.AppError("Inalid password", 400);
        const tokenId = (0, uuid_1.v4)();
        const signatureAccess = user.role == user_model_1.RoleType.user ? process.env.ACCESS_TOKEN_USER : process.env.ACCESS_TOKEN_ADMIN;
        const signatureRefresh = user.role == user_model_1.RoleType.user ? process.env.REFRESH_TOKEN_USER : process.env.REFRESH_TOKEN_ADMIN;
        const accessToken = await (0, token_1.GenerateToken)({ payload: { id: user._id }, signature: signatureAccess, options: { expiresIn: "1h", jwtid: tokenId } });
        const refreshToken = await (0, token_1.GenerateToken)({ payload: { id: user._id }, signature: signatureRefresh, options: { expiresIn: "1y", jwtid: tokenId } });
        return res.status(200).json({ message: "Done", accessToken, refreshToken });
    };
    loginWithGmail = async (req, res, next) => {
        const { idToken } = req.body;
        const client = new google_auth_library_1.OAuth2Client();
        async function verify() {
            const ticket = await client.verifyIdToken({
                idToken,
                audience: process.env.WEB_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            return payload;
        }
        const { email, email_verified, picture, name } = await verify();
        let user = await this._userModel.findOne({ email });
        if (!user) {
            user = await this._userModel.create({
                email: email,
                image: picture,
                userName: name,
                isConfirmed: email_verified,
                provider: user_model_1.ProviderType.google
            });
        }
        if (user.provider !== user_model_1.ProviderType.google)
            throw new classError_1.AppError("Please login on system", 400);
        const tokenId = (0, uuid_1.v4)();
        const signatureAccess = user.role == user_model_1.RoleType.user ? process.env.ACCESS_TOKEN_USER : process.env.ACCESS_TOKEN_ADMIN;
        const signatureRefresh = user.role == user_model_1.RoleType.user ? process.env.REFRESH_TOKEN_USER : process.env.REFRESH_TOKEN_ADMIN;
        const accessToken = await (0, token_1.GenerateToken)({ payload: { id: user._id }, signature: signatureAccess, options: { expiresIn: "1h", jwtid: tokenId } });
        const refreshToken = await (0, token_1.GenerateToken)({ payload: { id: user._id }, signature: signatureRefresh, options: { expiresIn: "1y", jwtid: tokenId } });
        return res.status(200).json({ message: "Login successful", accessToken, refreshToken });
    };
    getProfile = async (req, res, next) => {
        return res.status(200).json({ message: "Done", user: req.user });
    };
    logout = async (req, res, next) => {
        const { flag } = req.body;
        if (flag === user_model_1.FlagType?.all) {
            await this._userModel.updateOne({ _id: req.user?._id }, { changeCredentials: new Date() });
            return res.status(200).json({ message: "Successfully logged out from all devices" });
        }
        await this._revokeTokenModel.create({ tokenId: req.decodedToken?.jti, userId: req.user?._id, expireAt: new Date(req.decodedToken?.exp * 1000) });
        return res.status(200).json({ message: "Successfully logged out from this device" });
    };
    refreshToken = async (req, res, next) => {
        const tokenId = (0, uuid_1.v4)();
        const signatureAccess = req.user?.role == user_model_1.RoleType.user ? process.env.ACCESS_TOKEN_USER : process.env.ACCESS_TOKEN_ADMIN;
        const signatureRefresh = req.user?.role == user_model_1.RoleType.user ? process.env.REFRESH_TOKEN_USER : process.env.REFRESH_TOKEN_ADMIN;
        const accessToken = await (0, token_1.GenerateToken)({ payload: { id: req.user?._id }, signature: signatureAccess, options: { expiresIn: "1h", jwtid: tokenId } });
        const refreshToken = await (0, token_1.GenerateToken)({ payload: { id: req.user?._id }, signature: signatureRefresh, options: { expiresIn: "1y", jwtid: tokenId } });
        await this._revokeTokenModel.create({ tokenId: req.decodedToken?.jti, userId: req.user?._id, expireAt: new Date(req.decodedToken?.exp * 1000) });
        return res.status(200).json({ message: "Done", accessToken, refreshToken });
    };
    forgetPassword = async (req, res, next) => {
        const { email } = req.body;
        const user = await this._userModel.findOne({ email, isConfirmed: { $exists: true } });
        if (!user)
            throw new classError_1.AppError("User doesn't exist or not confirmed yet", 404);
        const otp = await (0, sendEmail_1.generateOTP)();
        const hashedOTP = await (0, hash_1.Hash)(String(otp));
        events_1.eventEmitter.emit("forgetPassword", { email, otp });
        await this._userModel.updateOne({ email: user?.email }, { otp: hashedOTP });
        return res.status(200).json({ message: "OTP sent to email" });
    };
    resetPassword = async (req, res, next) => {
        const { email, otp, password, cPassword } = req.body;
        const user = await this._userModel.findOne({ email, otp: { $exists: true } });
        if (!user)
            throw new classError_1.AppError("User doesn't exist", 404);
        if (!await (0, hash_1.Compare)(otp, user?.otp))
            throw new classError_1.AppError("Inalid OTP", 400);
        const hashedPassword = (0, hash_1.Hash)(password);
        await this._userModel.updateOne({ email: user?.email }, { password: hashedPassword, $unset: { otp: "" } });
        return res.status(200).json({ message: "Done" });
    };
    uploadImage = async (req, res, next) => {
        const key = await (0, s3_config_2.uploadFile)({
            file: req.file,
            path: `users/${req.user?._id}`,
        });
        return res.status(200).json({ message: "Done", key });
    };
    uploadLargeImage = async (req, res, next) => {
        const key = await (0, s3_config_1.uploadLargeFile)({
            file: req.file,
            path: `users/${req.user?._id}`,
        });
        return res.status(200).json({ message: "Done", key });
    };
    uploadImages = async (req, res, next) => {
        const keys = await (0, s3_config_1.uploadFiles)({
            files: req.files,
            path: `users/${req.user?._id}`,
        });
        return res.status(200).json({ message: "Done", keys });
    };
    uploadImageWithPresignedURL = async (req, res, next) => {
        const { originalname, ContentType } = req.body;
        const { url, Key } = await (0, s3_config_1.createUploadFilePresignedURL)({
            originalname,
            ContentType,
            path: `users/${req.user?._id}`
        });
        const user = this._userModel.findOneAndUpdate({ _id: req.user?._id }, { profileImage: Key, tempProfileImage: req.user?.profileImage });
        if (!user)
            throw new classError_1.AppError("User not found", 404);
        events_1.eventEmitter.emit("uploadProfileImage", { userId: req.user?._id, oldKey: req.user?.profileImage, Key, expiresIn: 60 });
        return res.status(200).json({ message: "Done", url, user });
    };
    freezeAccount = async (req, res, next) => {
        const { userId } = req.params;
        if (userId && req.user?.role !== user_model_1.RoleType.admin)
            throw new classError_1.AppError("UnAuthorized", 401);
        const user = await this._userModel.findOneAndUpdate({ _id: userId || req.user?._id, deletedAt: { $exists: false } }, { deletedAt: new Date(), deletedBy: req.user?._id, changeCredentials: new Date() });
        if (!user)
            throw new classError_1.AppError("User not found", 404);
        return res.status(200).json({ message: "User Freezed" });
    };
    unfreezeAccount = async (req, res, next) => {
        const { userId } = req.params;
        if (userId && req.user?.role !== user_model_1.RoleType.admin)
            throw new classError_1.AppError("UnAuthorized", 401);
        const user = await this._userModel.findOneAndUpdate({ _id: userId, deletedAt: { $exists: true }, deletedBy: { $ne: req.user?._id } }, { $unset: { deletedAt: "", deletedBy: "" }, restoredAt: new Date(), restoredBy: req.user?._id });
        if (!user)
            throw new classError_1.AppError("User not found", 404);
        return res.status(200).json({ message: "User Restored" });
    };
    deleteAccount = async (req, res, next) => {
        const { userId } = req.params;
        if (req.user?.role !== user_model_1.RoleType.admin)
            throw new classError_1.AppError("UnAuthorized", 401);
        if (req.user?._id.toString() === userId)
            throw new classError_1.AppError("You can't delete yourself, contact your admin", 403);
        const user = await this._userModel.findOneAndDelete({ _id: userId, deletedAt: { $exists: true } });
        if (!user)
            throw new classError_1.AppError("User not found or hasn't been freezed", 404);
        await (0, helperFunctions_1.deleteUserCascade)(userId);
        return res.status(200).json({ message: "User Deleted" });
    };
    sendFriendRequest = async (req, res, next) => {
        const { userId } = req.params;
        if (req.user?._id.toString() === userId)
            throw new classError_1.AppError("You can't send a friend request to yourself", 403);
        const user = await this._userModel.findOne({ _id: userId });
        if (!user)
            throw new classError_1.AppError("User not found", 404);
        const checkRequest = await this._friendRequestModel.findOne({
            sentFrom: { $in: [req.user?._id, userId] },
            sentTo: { $in: [req.user?._id, userId] },
        });
        if (checkRequest)
            throw new classError_1.AppError("Request already sent", 409);
        const friendRequest = await this._friendRequestModel.create({
            sentFrom: req.user?._id,
            sentTo: userId,
        });
        return res.status(200).json({ message: "Request sent" });
    };
    acceptOrDeleteFriendRequest = async (req, res, next) => {
        const { requestId, action } = req.params;
        if (action === friendRequest_model_1.RequestActionEnum.accept) {
            const checkRequest = await this._friendRequestModel.findOneAndUpdate({
                _id: requestId,
                sentTo: req.user?._id,
                acceptedAt: { $exists: false }
            }, { acceptedAt: new Date() }, { new: true });
            if (!checkRequest)
                throw new classError_1.AppError("Request not found", 404);
            Promise.all([
                this._userModel.updateOne({ _id: checkRequest.sentFrom }, { $push: { friends: checkRequest.sentTo } }),
                this._userModel.updateOne({ _id: checkRequest.sentTo }, { $push: { friends: checkRequest.sentFrom } }),
            ]);
        }
        else if (action === friendRequest_model_1.RequestActionEnum.delete) {
            const checkRequest = await this._friendRequestModel.findOneAndDelete({
                _id: requestId,
                sentTo: req.user?._id,
                acceptedAt: { $exists: false }
            });
            if (!checkRequest)
                throw new classError_1.AppError("Request not found", 404);
        }
        else
            throw new classError_1.AppError("Unknown action", 400);
        return res.status(200).json({ message: "Done" });
    };
    unfriend = async (req, res, next) => {
        const { userId } = req.params;
        if (req.user?._id.toString() === userId)
            throw new classError_1.AppError("You can't unfriend yourself", 403);
        const user = await this._userModel.findOne({ _id: userId });
        if (!user)
            throw new classError_1.AppError("User not found", 404);
        const checkRequest = await this._friendRequestModel.findOneAndDelete({
            sentFrom: userId,
            sentTo: req.user?._id,
            acceptedAt: { $exists: true }
        });
        if (!checkRequest)
            throw new classError_1.AppError("Request not found or you haven't accepted the request", 404);
        Promise.all([
            this._userModel.updateOne({ _id: checkRequest.sentFrom }, { $pull: { friends: checkRequest.sentTo } }),
            this._userModel.updateOne({ _id: checkRequest.sentTo }, { $pull: { friends: checkRequest.sentFrom } }),
        ]);
        return res.status(200).json({ message: "Done" });
    };
    blockUser = async (req, res, next) => {
        const { userId } = req.params;
        if (req.user?._id.toString() === userId)
            throw new classError_1.AppError("You can't block yourself", 403);
        const user = await this._userModel.findOne({ _id: userId });
        if (!user)
            throw new classError_1.AppError("User not found", 404);
        const blockedUser = await this._userModel.updateOne({ _id: req.user?._id }, { $push: { blockedUsers: user._id } });
        if (req.user?.friends.includes(user._id))
            this._userModel.updateOne({ _id: req.user?._id }, { $pull: { friends: user._id } });
        return res.status(200).json({ message: "User Blocked" });
    };
    unblockUser = async (req, res, next) => {
        const { userId } = req.params;
        if (req.user?._id.toString() === userId)
            throw new classError_1.AppError("You can't unblock yourself", 403);
        const user = await this._userModel.findOne({ _id: userId });
        if (!user)
            throw new classError_1.AppError("User not found", 404);
        const unblockedUser = await this._userModel.updateOne({ _id: req.user?._id }, { $pull: { blockedUsers: user._id } });
        return res.status(200).json({ message: "User Unblocked" });
    };
}
exports.default = new UserService();
