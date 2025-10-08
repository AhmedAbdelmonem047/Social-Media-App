"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventEmitter = void 0;
const sendEmail_1 = require("./../services/sendEmail");
const events_1 = require("events");
const email_template_1 = require("../services/email.template");
const user_repository_1 = require("../repositories/user.repository");
const user_model_1 = __importDefault(require("../DB/models/user.model"));
const s3_config_1 = require("./s3.config");
exports.eventEmitter = new events_1.EventEmitter();
exports.eventEmitter.on("confirmEmail", async (data) => {
    const { email, otp } = data;
    await (0, sendEmail_1.sendEmail)({ to: email, subject: "Confirm Email", html: (0, email_template_1.emailTemplate)(otp, "Email Confirmation") });
});
exports.eventEmitter.on("forgetPassword", async (data) => {
    const { email, otp } = data;
    await (0, sendEmail_1.sendEmail)({ to: email, subject: "Password Reset", html: (0, email_template_1.emailTemplate)(otp, "Password Reset") });
});
exports.eventEmitter.on("uploadProfileImage", async (data) => {
    const { userId, oldKey, Key, expiresIn } = data;
    const _userModel = new user_repository_1.UserRepository(user_model_1.default);
    setTimeout(async () => {
        try {
            await (0, s3_config_1.getFile)({ Key });
            await _userModel.findOneAndUpdate({ _id: userId }, { $unset: { tempProfileImage: "" } });
            if (oldKey)
                await (0, s3_config_1.deleteFile)({ Key: oldKey });
        }
        catch (error) {
            if (error?.Code == 'NoSuchKey') {
                if (!oldKey)
                    await _userModel.findOneAndUpdate({ _id: userId }, { $unset: { profileImage: "" } });
                else
                    await _userModel.findOneAndUpdate({ _id: userId }, { $set: { profileImage: oldKey }, $unset: { tempProfileImage: "" } });
            }
        }
    }, expiresIn * 1000);
});
exports.eventEmitter.on("mentionTags", async (data) => {
    const { postId, authorId, tags } = data;
    const _userModel = new user_repository_1.UserRepository(user_model_1.default);
    const users = await _userModel.find({ _id: { $in: tags } });
    for (const user of users) {
        await (0, sendEmail_1.sendEmail)({ to: user.email, subject: "You were tagged", html: (0, email_template_1.emailTemplate)(`You were tagged in post ${postId} by user ${authorId}`, "Tags") });
    }
});
