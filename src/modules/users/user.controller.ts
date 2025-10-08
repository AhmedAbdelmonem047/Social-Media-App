import { Router } from "express";
import US from './user.service'
import { Validation } from "../../middleware/validation";
import * as UV from "./user.validation";
import { Authentication, Authorization } from "../../middleware/authentication";
import { TokenType } from "../../utils/token";
import { FileTypes, multerCloud } from "../../middleware/multer.cloud";
import { RoleType } from "../../DB/models/user.model.js";
const userRouter = Router()

userRouter.post('/signup', Validation(UV.signupSchema), US.signup);
userRouter.patch('/confirmEmail', Validation(UV.confirmEmailSchema), US.confirmEmail);
userRouter.post('/login', Validation(UV.loginSchema), US.login);
userRouter.post('/loginWithGmail', Validation(UV.loginWithGmailSchema), US.loginWithGmail);
userRouter.get('/profile', Authentication(), US.getProfile);
userRouter.post('/logout', Authentication(), Validation(UV.logoutSchema), US.logout);
userRouter.get('/refreshToken', Authentication(TokenType.refresh), US.refreshToken);
userRouter.patch('/forgetPassword', Authentication(), Validation(UV.forgetPasswordSchema), US.forgetPassword);
userRouter.patch('/resetPassword', Authentication(), Validation(UV.resetPasswordSchema), US.resetPassword);
userRouter.post('/upload', Authentication(), multerCloud({ fileTypes: FileTypes.image }).single("file"), US.uploadImageWithPresignedURL);
userRouter.post('/uploadFiles', Authentication(), multerCloud({ fileTypes: FileTypes.image }).array("files"), US.uploadImages);
userRouter.patch('/freeze{/:userId}', Authentication(), Validation(UV.freezeAccountSchema), US.freezeAccount);
userRouter.patch('/unfreeze{/:userId}', Authentication(), Validation(UV.freezeAccountSchema), US.unfreezeAccount);
userRouter.delete('/delete/:userId', Authentication(), Authorization({ accessRoles: [RoleType.admin] }), Validation(UV.deleteAccountSchema), US.deleteAccount);
userRouter.patch('/sendRequest/:userId', Authentication(), Validation(UV.freezeAccountSchema), US.sendFriendRequest);
userRouter.patch('/acceptDelete/:requestId/:action', Authentication(), Validation(UV.acceptDeleteSchema), US.acceptOrDeleteFriendRequest);
userRouter.patch('/unfriend/:userId', Authentication(), Validation(UV.deleteAccountSchema), US.unfriend);
userRouter.patch('/block/:userId', Authentication(), Validation(UV.deleteAccountSchema), US.blockUser);
userRouter.patch('/unblock/:userId', Authentication(), Validation(UV.deleteAccountSchema), US.unblockUser);

export default userRouter;