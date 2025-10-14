import { NextFunction, Request, Response } from "express";
import { Socket, Server } from "socket.io";
import { ChatRepository } from "../../repositories/chat.repo";
import chatModel from "../../DB/models/chat.model";
import { AppError } from "../../utils/classError";
import { UserRepository } from "../../repositories/user.repository";
import userModel from "../../DB/models/user.model";
import { connectionSockets } from "../gateway/gateway.js";


export class ChatService {

    private _userModel = new UserRepository(userModel);
    private _chatModel = new ChatRepository(chatModel);
    constructor() { }

    // =============== APIs =============== //
    getChat = async (req: Request, res: Response, next: NextFunction) => {
        const { userId } = req.params;

        const chat = await this._chatModel.findOne({
            participants: { $all: [userId, req.user?._id] },
            group: { $exists: false }
        }, undefined, {
            populate: [{
                path: "participants"
            }]
        })
        if (!chat)
            throw new AppError("Chat not found", 404);

        return res.status(200).json({ message: "Done", chat });
    }


    // ============ Socket Io ============= //
    sayHi = (data: any, socket: Socket, io: Server) => {
        console.log(data);
    }
    sendMessage = async (data: any, socket: Socket, io: Server) => {
        const { content, sendTo } = data;
        const createdBy = socket?.data?.user?._id;

        const user = await this._userModel.findOne({
            _id: sendTo,
            friends: { $in: [createdBy] }
        });
        if (!user)
            throw new AppError("User not found", 404);

        const chat = await this._chatModel.findOneAndUpdate({
            participants: { $all: [createdBy, sendTo] },
            group: { $exists: false }
        }, {
            $push: {
                messages: { content, createdBy }
            }
        });
        if (!chat) {
            const newChat = await this._chatModel.create({
                participants: [createdBy, sendTo],
                createdBy,
                messages: [{
                    content, createdBy
                }]
            })
        }
        io.to(connectionSockets.get(createdBy.toString())!).emit("successMessage", { content });
        io.to(connectionSockets.get(sendTo.toString())!).emit("newMessage", { content, from: socket?.data?.user });
    }
}