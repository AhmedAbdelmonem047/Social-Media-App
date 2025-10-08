import nodemailer from "nodemailer"
import Mail from "nodemailer/lib/mailer/index";

export const sendEmail = async (mailOptions: Mail.Options) => {
    const transporter = nodemailer.createTransport({
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
}

export const generateOTP = async (): Promise<number> => {
    return Math.floor(Math.random() * (999999 - 100000 + 1) + 100000);
}