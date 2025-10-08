import { createUploadFilePresignedURL, uploadFiles, uploadLargeFile } from './../../utils/s3.config';
import { NextFunction, Request, Response } from "express";
import { confirmEmailSchemaType, forgetPasswordSchemaType, loginSchemaType, loginWithGmailSchemaType, logoutSchemaType, resetPasswordSchemaType, signupSchemaType } from "./user.validation";
import userModel, { FlagType, ProviderType, RoleType } from "../../DB/models/user.model";
import { UserRepository } from "../../repositories/user.repository";
import { AppError } from "../../utils/classError";
import { Compare, Hash } from "../../utils/hash";
import { generateOTP } from "../../services/sendEmail";
import { eventEmitter } from '../../utils/events';
import { v4 as uuidv4 } from 'uuid';
import { GenerateToken } from "../../utils/token";
import { RevokeTokenRepository } from "../../repositories/revokeToken.repository";
import revokeTokenModel from "../../DB/models/revokeToken.model";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { uploadFile } from "../../utils/s3.config";
import { deleteUserCascade } from '../../utils/helperFunctions';
import mongoose, { Types } from 'mongoose';
import { FriendRequestRepository } from '../../repositories/friendRequest.repository';
import friendRequestModel, { RequestActionEnum } from '../../DB/models/friendRequest.model';

class UserService {

    private _userModel = new UserRepository(userModel);
    private _revokeTokenModel = new RevokeTokenRepository(revokeTokenModel);
    private _friendRequestModel = new FriendRequestRepository(friendRequestModel);
    constructor() { }

    // =============== Signup =============== //
    signup = async (req: Request, res: Response, next: NextFunction) => {
        const { userName, email, password, age, address, phone, gender }: signupSchemaType = req.body;

        if (await this._userModel.findOne({ email }))
            throw new AppError("Email already exists", 409);

        const otp = await generateOTP();
        const hashedOTP = await Hash(String(otp))
        eventEmitter.emit("confirmEmail", { email, otp });

        const hashedPassword = await Hash(password);
        const user = await this._userModel.createOneUser({ userName, email, password: hashedPassword, age, address, phone, gender, otp: hashedOTP });
        return res.status(201).json({ message: "User created successfully", user });
    }
    // ====================================== //


    // =========== Confirm Email ============ //
    confirmEmail = async (req: Request, res: Response, next: NextFunction) => {
        const { email, otp }: confirmEmailSchemaType = req.body;

        const user = await this._userModel.findOne({ email, isConfirmed: { $exists: false } });
        if (!user)
            throw new AppError("User not found or already confirmed", 404);
        if (!await Compare(otp, user?.otp!))
            throw new AppError("Inalid OTP", 400);

        this._userModel.updateOne({ email: user?.email }, { isConfirmed: true, $unset: { otp: "" } })
        return res.status(200).json({ message: "Email confirmed" });
    }
    // ====================================== //


    // ================ Login =============== //
    login = async (req: Request, res: Response, next: NextFunction) => {
        const { email, password }: loginSchemaType = req.body;

        const user = await this._userModel.findOne({ email, isConfirmed: true, provider: ProviderType.system });
        if (!user)
            throw new AppError("User not found or not confirmed yet or invalid provider", 404);
        if (!await Compare(password, user?.password!))
            throw new AppError("Inalid password", 400);

        const tokenId = uuidv4();
        const signatureAccess = user.role == RoleType.user ? process.env.ACCESS_TOKEN_USER! : process.env.ACCESS_TOKEN_ADMIN!
        const signatureRefresh = user.role == RoleType.user ? process.env.REFRESH_TOKEN_USER! : process.env.REFRESH_TOKEN_ADMIN!

        const accessToken = await GenerateToken({ payload: { id: user._id }, signature: signatureAccess, options: { expiresIn: "1h", jwtid: tokenId } });
        const refreshToken = await GenerateToken({ payload: { id: user._id }, signature: signatureRefresh, options: { expiresIn: "1y", jwtid: tokenId } });
        return res.status(200).json({ message: "Done", accessToken, refreshToken });
    }
    // ====================================== //


    // ============= Login Gmail ============ //
    loginWithGmail = async (req: Request, res: Response, next: NextFunction) => {
        const { idToken }: loginWithGmailSchemaType = req.body;
        const client = new OAuth2Client();
        async function verify() {
            const ticket = await client.verifyIdToken({
                idToken,
                audience: process.env.WEB_CLIENT_ID!,
            });
            const payload = ticket.getPayload();
            return payload;
        }
        const { email, email_verified, picture, name } = await verify() as TokenPayload;

        let user = await this._userModel.findOne({ email });
        if (!user) {
            user = await this._userModel.create({
                email: email!,
                image: picture!,
                userName: name!,
                isConfirmed: email_verified!,
                provider: ProviderType.google
            })
        }

        if (user.provider !== ProviderType.google)
            throw new AppError("Please login on system", 400);

        const tokenId = uuidv4();
        const signatureAccess = user.role == RoleType.user ? process.env.ACCESS_TOKEN_USER! : process.env.ACCESS_TOKEN_ADMIN!
        const signatureRefresh = user.role == RoleType.user ? process.env.REFRESH_TOKEN_USER! : process.env.REFRESH_TOKEN_ADMIN!

        const accessToken = await GenerateToken({ payload: { id: user._id }, signature: signatureAccess, options: { expiresIn: "1h", jwtid: tokenId } });
        const refreshToken = await GenerateToken({ payload: { id: user._id }, signature: signatureRefresh, options: { expiresIn: "1y", jwtid: tokenId } });

        return res.status(200).json({ message: "Login successful", accessToken, refreshToken });
    }
    // ====================================== //


    // ============= Get Profile ============ //
    getProfile = async (req: Request, res: Response, next: NextFunction) => {
        return res.status(200).json({ message: "Done", user: req.user });
    }
    // ====================================== //


    // ================ Logout ============== //
    logout = async (req: Request, res: Response, next: NextFunction) => {
        const { flag }: logoutSchemaType = req.body;

        if (flag === FlagType?.all) {
            await this._userModel.updateOne({ _id: req.user?._id }, { changeCredentials: new Date() });
            return res.status(200).json({ message: "Successfully logged out from all devices" });
        }

        await this._revokeTokenModel.create({ tokenId: req.decodedToken?.jti!, userId: req.user?._id!, expireAt: new Date(req.decodedToken?.exp! * 1000) });
        return res.status(200).json({ message: "Successfully logged out from this device" });
    }
    // ====================================== //


    // ============ Refresh Token =========== //
    refreshToken = async (req: Request, res: Response, next: NextFunction) => {

        const tokenId = uuidv4();
        const signatureAccess = req.user?.role == RoleType.user ? process.env.ACCESS_TOKEN_USER! : process.env.ACCESS_TOKEN_ADMIN!
        const signatureRefresh = req.user?.role == RoleType.user ? process.env.REFRESH_TOKEN_USER! : process.env.REFRESH_TOKEN_ADMIN!

        const accessToken = await GenerateToken({ payload: { id: req.user?._id }, signature: signatureAccess, options: { expiresIn: "1h", jwtid: tokenId } });
        const refreshToken = await GenerateToken({ payload: { id: req.user?._id }, signature: signatureRefresh, options: { expiresIn: "1y", jwtid: tokenId } });

        await this._revokeTokenModel.create({ tokenId: req.decodedToken?.jti!, userId: req.user?._id!, expireAt: new Date(req.decodedToken?.exp! * 1000) });
        return res.status(200).json({ message: "Done", accessToken, refreshToken });
    }
    // ====================================== //


    // =========== Foregt Password ========== //
    forgetPassword = async (req: Request, res: Response, next: NextFunction) => {
        const { email }: forgetPasswordSchemaType = req.body

        const user = await this._userModel.findOne({ email, isConfirmed: { $exists: true } });
        if (!user)
            throw new AppError("User doesn't exist or not confirmed yet", 404);
        const otp = await generateOTP();
        const hashedOTP = await Hash(String(otp))
        eventEmitter.emit("forgetPassword", { email, otp });

        await this._userModel.updateOne({ email: user?.email }, { otp: hashedOTP });

        return res.status(200).json({ message: "OTP sent to email" });
    }
    // ====================================== //


    // ============ Reset Password ========== //
    resetPassword = async (req: Request, res: Response, next: NextFunction) => {
        const { email, otp, password, cPassword }: resetPasswordSchemaType = req.body

        const user = await this._userModel.findOne({ email, otp: { $exists: true } });
        if (!user)
            throw new AppError("User doesn't exist", 404);

        if (!await Compare(otp, user?.otp!))
            throw new AppError("Inalid OTP", 400);

        const hashedPassword = Hash(password);

        await this._userModel.updateOne({ email: user?.email }, { password: hashedPassword, $unset: { otp: "" } });

        return res.status(200).json({ message: "Done" });
    }
    // ====================================== //


    // ============= Upload Image =========== //
    uploadImage = async (req: Request, res: Response, next: NextFunction) => {

        const key = await uploadFile({
            file: req.file!,
            path: `users/${req.user?._id}`,
        })

        return res.status(200).json({ message: "Done", key });
    }
    // ====================================== //


    // ========== Upload Large Image ======== //
    uploadLargeImage = async (req: Request, res: Response, next: NextFunction) => {

        const key = await uploadLargeFile({
            file: req.file!,
            path: `users/${req.user?._id}`,
        })

        return res.status(200).json({ message: "Done", key });
    }
    // ====================================== //


    // ============ Upload Images =========== //
    uploadImages = async (req: Request, res: Response, next: NextFunction) => {

        const keys = await uploadFiles({
            files: req.files! as Express.Multer.File[],
            path: `users/${req.user?._id}`,
        })

        return res.status(200).json({ message: "Done", keys });
    }
    // ====================================== //


    // ====== Upload With Presigned URL ===== //
    uploadImageWithPresignedURL = async (req: Request, res: Response, next: NextFunction) => {

        const { originalname, ContentType } = req.body;
        const { url, Key } = await createUploadFilePresignedURL({
            originalname,
            ContentType,
            path: `users/${req.user?._id}`
        })

        const user = this._userModel.findOneAndUpdate({ _id: req.user?._id }, { profileImage: Key, tempProfileImage: req.user?.profileImage });
        if (!user)
            throw new AppError("User not found", 404);

        eventEmitter.emit("uploadProfileImage", { userId: req.user?._id, oldKey: req.user?.profileImage, Key, expiresIn: 60 });

        return res.status(200).json({ message: "Done", url, user });
    }
    // ====================================== //


    // =========== Freeze Account =========== //
    freezeAccount = async (req: Request, res: Response, next: NextFunction) => {
        const { userId } = req.params;

        if (userId && req.user?.role !== RoleType.admin)
            throw new AppError("UnAuthorized", 401);

        const user = await this._userModel.findOneAndUpdate({ _id: userId || req.user?._id, deletedAt: { $exists: false } }, { deletedAt: new Date(), deletedBy: req.user?._id, changeCredentials: new Date() });
        if (!user)
            throw new AppError("User not found", 404)
        return res.status(200).json({ message: "User Freezed" });
    }
    // ====================================== //

    
    // ========== Unfreeze Account ========== //
    unfreezeAccount = async (req: Request, res: Response, next: NextFunction) => {
        const { userId } = req.params;

        if (userId && req.user?.role !== RoleType.admin)
            throw new AppError("UnAuthorized", 401);

        const user = await this._userModel.findOneAndUpdate({ _id: userId, deletedAt: { $exists: true }, deletedBy: { $ne: req.user?._id } }, { $unset: { deletedAt: "", deletedBy: "" }, restoredAt: new Date(), restoredBy: req.user?._id });
        if (!user)
            throw new AppError("User not found", 404)
        return res.status(200).json({ message: "User Restored" });
    }
    // ====================================== //


    // =========== Delete Account =========== //
    deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
        const { userId } = req.params;

        if (req.user?.role !== RoleType.admin)
            throw new AppError("UnAuthorized", 401);
        if (req.user?._id.toString() === userId)
            throw new AppError("You can't delete yourself, contact your admin", 403);

        const user = await this._userModel.findOneAndDelete({ _id: userId, deletedAt: { $exists: true } });
        if (!user)
            throw new AppError("User not found or hasn't been freezed", 404);
        await deleteUserCascade(userId as unknown as mongoose.Types.ObjectId);

        return res.status(200).json({ message: "User Deleted" });
    }
    // ====================================== //


    // ======== Send Friend Request ========= //
    sendFriendRequest = async (req: Request, res: Response, next: NextFunction) => {
        const { userId } = req.params;

        if (req.user?._id.toString() === userId)
            throw new AppError("You can't send a friend request to yourself", 403);

        const user = await this._userModel.findOne({ _id: userId });
        if (!user)
            throw new AppError("User not found", 404);

        const checkRequest = await this._friendRequestModel.findOne({
            sentFrom: { $in: [req.user?._id, userId] },
            sentTo: { $in: [req.user?._id, userId] },
        })
        if (checkRequest)
            throw new AppError("Request already sent", 409);


        const friendRequest = await this._friendRequestModel.create({
            sentFrom: req.user?._id as unknown as Types.ObjectId,
            sentTo: userId as unknown as Types.ObjectId,
        })


        return res.status(200).json({ message: "Request sent" });
    }
    // ====================================== //


    // == Accept Or Delete Friend Request == //
    acceptOrDeleteFriendRequest = async (req: Request, res: Response, next: NextFunction) => {
        const { requestId, action } = req.params;

        if (action === RequestActionEnum.accept) {
            const checkRequest = await this._friendRequestModel.findOneAndUpdate({
                _id: requestId,
                sentTo: req.user?._id,
                acceptedAt: { $exists: false }
            }, { acceptedAt: new Date() }, { new: true });
            if (!checkRequest)
                throw new AppError("Request not found", 404);
            Promise.all([
                this._userModel.updateOne({ _id: checkRequest.sentFrom }, { $push: { friends: checkRequest.sentTo } }),
                this._userModel.updateOne({ _id: checkRequest.sentTo }, { $push: { friends: checkRequest.sentFrom } }),
            ]);
        }
        else if (action === RequestActionEnum.delete) {
            const checkRequest = await this._friendRequestModel.findOneAndDelete({
                _id: requestId,
                sentTo: req.user?._id,
                acceptedAt: { $exists: false }
            });
            if (!checkRequest)
                throw new AppError("Request not found", 404);
        }
        else
            throw new AppError("Unknown action", 400);


        return res.status(200).json({ message: "Done" });
    }
    // ====================================== //


    // ============== Unfriend ============== //
    unfriend = async (req: Request, res: Response, next: NextFunction) => {
        const { userId } = req.params;

        if (req.user?._id.toString() === userId)
            throw new AppError("You can't unfriend yourself", 403);

        const user = await this._userModel.findOne({ _id: userId });
        if (!user)
            throw new AppError("User not found", 404);

        const checkRequest = await this._friendRequestModel.findOneAndDelete({
            sentFrom: userId,
            sentTo: req.user?._id,
            acceptedAt: { $exists: true }
        });
        if (!checkRequest)
            throw new AppError("Request not found or you haven't accepted the request", 404);

        Promise.all([
            this._userModel.updateOne({ _id: checkRequest.sentFrom }, { $pull: { friends: checkRequest.sentTo } }),
            this._userModel.updateOne({ _id: checkRequest.sentTo }, { $pull: { friends: checkRequest.sentFrom } }),
        ]);

        return res.status(200).json({ message: "Done" });
    }
    // ====================================== //


    // ============= Block User ============= //
    blockUser = async (req: Request, res: Response, next: NextFunction) => {
        const { userId } = req.params;

        if (req.user?._id.toString() === userId)
            throw new AppError("You can't block yourself", 403);

        const user = await this._userModel.findOne({ _id: userId });
        if (!user)
            throw new AppError("User not found", 404);

        const blockedUser = await this._userModel.updateOne({ _id: req.user?._id }, { $push: { blockedUsers: user._id } });
        if (req.user?.friends.includes(user._id))
            this._userModel.updateOne({ _id: req.user?._id }, { $pull: { friends: user._id } })

        return res.status(200).json({ message: "User Blocked" });
    }
    // ====================================== //


    // ============ Unblock User ============ //
    unblockUser = async (req: Request, res: Response, next: NextFunction) => {
        const { userId } = req.params;

        if (req.user?._id.toString() === userId)
            throw new AppError("You can't unblock yourself", 403);

        const user = await this._userModel.findOne({ _id: userId });
        if (!user)
            throw new AppError("User not found", 404);

        const unblockedUser = await this._userModel.updateOne({ _id: req.user?._id }, { $pull: { blockedUsers: user._id } });
        
        return res.status(200).json({ message: "User Unblocked" });
    }
    // ====================================== //
}

export default new UserService()
