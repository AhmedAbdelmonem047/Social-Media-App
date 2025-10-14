"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeGateway = exports.connectionSockets = void 0;
const socket_io_1 = require("socket.io");
const classError_1 = require("../../utils/classError");
const token_1 = require("../../utils/token");
const chat_gateway_1 = require("../chat/chat.gateway");
exports.connectionSockets = new Map();
let io = undefined;
const initializeGateway = (httpServer) => {
    io = new socket_io_1.Server(httpServer, { cors: { origin: "" } });
    io.use(async (socket, next) => {
        try {
            const { authorization } = socket.handshake.auth;
            const [prefix, token] = authorization?.split(" ") || [];
            if (!prefix || !token)
                return next(new classError_1.AppError("Token or prefix not found", 404));
            const signature = await (0, token_1.getSignature)(prefix);
            if (!signature)
                return next(new classError_1.AppError("Invalid signature", 400));
            const { user, decodedToken } = await (0, token_1.decodeTokenAndFetchUser)(token, signature);
            const socketIds = exports.connectionSockets.get(user?._id.toString()) || [];
            socketIds?.push(socket.id);
            exports.connectionSockets.set(user._id.toString(), socketIds);
            socket.data.user = user;
            next();
        }
        catch (error) {
            next(error);
        }
    });
    const chatGateway = new chat_gateway_1.ChatGateway();
    io.on("connection", (socket) => {
        chatGateway.register(socket, getIo());
        function removeSocket() {
            const remainingSocketIds = exports.connectionSockets.get(socket.data.user._id.toString())?.filter((socketId) => socketId !== socket.id);
            if (remainingSocketIds?.length)
                exports.connectionSockets.set(socket.data.user._id.toString(), remainingSocketIds);
            else
                exports.connectionSockets.delete(socket.data.user._id.toString());
            getIo().emit("offline_user", socket.data.user._id.toString());
            console.log({ after: exports.connectionSockets });
        }
        socket.on("disconnect", () => {
            removeSocket();
        });
    });
};
exports.initializeGateway = initializeGateway;
const getIo = () => {
    if (!io)
        throw new classError_1.AppError("Io not initialized", 400);
    return io;
};
