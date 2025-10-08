"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOTP = exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const sendEmail = async (mailOptions) => {
    const transporter = nodemailer_1.default.createTransport({
        port: 465,
        secure: true,
        service: "gmail",
        auth: {
            user: process.env.SERVICE_MAILER_EMAIL,
            pass: process.env.SERVICE_MAILER_PASS,
        },
    });
    const info = await transporter.sendMail({
        from: `"SocialMediaApp" <${process.env.SERVICE_MAILER_EMAIL}>`,
        ...mailOptions
    });
    console.log("Message sent: ", info.messageId);
};
exports.sendEmail = sendEmail;
const generateOTP = async () => {
    return Math.floor(Math.random() * (999999 - 100000 + 1) + 100000);
};
exports.generateOTP = generateOTP;
