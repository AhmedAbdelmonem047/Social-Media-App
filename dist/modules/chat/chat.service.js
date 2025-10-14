"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const chat_repo_1 = require("../../repositories/chat.repo");
const chat_model_1 = __importDefault(require("../../DB/models/chat.model"));
const classError_1 = require("../../utils/classError");
const user_repository_1 = require("../../repositories/user.repository");
const user_model_1 = __importDefault(require("../../DB/models/user.model"));
const gateway_js_1 = require("../gateway/gateway.js");
class ChatService {
    _userModel = new user_repository_1.UserRepository(user_model_1.default);
    _chatModel = new chat_repo_1.ChatRepository(chat_model_1.default);
    constructor() { }
    getChat = async (req, res, next) => {
        const { userId } = req.params;
        const chat = await this._chatModel.findOne({
            participants: { $all: [userId, req.user?._id] },
            group: { $exists: false }
        }, undefined, {
            populate: [{
                    path: "participants"
                }]
        });
        if (!chat)
            throw new classError_1.AppError("Chat not found", 404);
        return res.status(200).json({ message: "Done", chat });
    };
    sayHi = (data, socket, io) => {
        console.log(data);
    };
    sendMessage = async (data, socket, io) => {
        const { content, sendTo } = data;
        const createdBy = socket?.data?.user?._id;
        const user = await this._userModel.findOne({
            _id: sendTo,
            friends: { $in: [createdBy] }
        });
        if (!user)
            throw new classError_1.AppError("User not found", 404);
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
            });
        }
        io.to(gateway_js_1.connectionSockets.get(createdBy.toString())).emit("successMessage", { content });
        io.to(gateway_js_1.connectionSockets.get(sendTo.toString())).emit("newMessage", { content, from: socket?.data?.user });
    };
}
exports.ChatService = ChatService;
