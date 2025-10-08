import { sendEmail } from './../services/sendEmail';
import { EventEmitter } from "events";
import { emailTemplate } from '../services/email.template';
import { UserRepository } from '../repositories/user.repository';
import userModel from '../DB/models/user.model';
import { deleteFile, getFile } from './s3.config';

export const eventEmitter = new EventEmitter();

eventEmitter.on("confirmEmail", async (data) => {
    const { email, otp } = data;
    await sendEmail({ to: email, subject: "Confirm Email", html: emailTemplate(otp as unknown as string, "Email Confirmation") });
})

eventEmitter.on("forgetPassword", async (data) => {
    const { email, otp } = data;
    await sendEmail({ to: email, subject: "Password Reset", html: emailTemplate(otp as unknown as string, "Password Reset") });
})

eventEmitter.on("uploadProfileImage", async (data) => {
    const { userId, oldKey, Key, expiresIn } = data;
    const _userModel = new UserRepository(userModel);
    setTimeout(async () => {
        try {
            await getFile({ Key });
            await _userModel.findOneAndUpdate({ _id: userId }, { $unset: { tempProfileImage: "" } });
            if (oldKey)
                await deleteFile({ Key: oldKey });
        } catch (error: any) {
            if (error?.Code == 'NoSuchKey') {
                if (!oldKey)
                    await _userModel.findOneAndUpdate({ _id: userId }, { $unset: { profileImage: "" } });
                else
                    await _userModel.findOneAndUpdate({ _id: userId }, { $set: { profileImage: oldKey }, $unset: { tempProfileImage: "" } });
            }
        }
    }, expiresIn * 1000);
})

eventEmitter.on("mentionTags", async (data) => {
    const { postId, authorId, tags } = data;
    const _userModel = new UserRepository(userModel);

    const users = await _userModel.find({ _id: { $in: tags } });
    for (const user of users) {
        await sendEmail({ to: user.email, subject: "You were tagged", html: emailTemplate(`You were tagged in post ${postId} by user ${authorId}` as unknown as string, "Tags") });
    }
})