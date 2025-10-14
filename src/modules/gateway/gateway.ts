import { Server, Socket } from "socket.io"
import { Server as HttpServer } from "http"
import { AppError } from "../../utils/classError";
import { decodeTokenAndFetchUser, getSignature } from "../../utils/token";
import { ChatGateway } from "../chat/chat.gateway";

export const connectionSockets = new Map<string, string[]>();
let io: Server | undefined = undefined;

export const initializeGateway = (httpServer: HttpServer) => {

    io = new Server(httpServer, { cors: { origin: "" } });

    io.use(async (socket: Socket, next) => {
        try {
            const { authorization } = socket.handshake.auth;
            const [prefix, token] = authorization?.split(" ") || [];
            if (!prefix || !token)
                return next(new AppError("Token or prefix not found", 404));

            const signature = await getSignature(prefix);
            if (!signature)
                return next(new AppError("Invalid signature", 400));

            const { user, decodedToken } = await decodeTokenAndFetchUser(token, signature);

            const socketIds = connectionSockets.get(user?._id.toString()) || [];
            socketIds?.push(socket.id);
            connectionSockets.set(user._id.toString(), socketIds);
            socket.data.user = user;
            next()
        } catch (error: any) {
            next(error);
        }
    })

    const chatGateway: ChatGateway = new ChatGateway();

    io.on("connection", (socket: Socket) => {

        chatGateway.register(socket, getIo());

        function removeSocket() {
            const remainingSocketIds = connectionSockets.get(socket.data.user._id.toString())?.filter((socketId) => socketId !== socket.id);

            if (remainingSocketIds?.length)
                connectionSockets.set(socket.data.user._id.toString(), remainingSocketIds);
            else
                connectionSockets.delete(socket.data.user._id.toString());

            getIo().emit("offline_user", socket.data.user._id.toString());
            console.log({ after: connectionSockets });
        }
        socket.on("disconnect", () => {
            removeSocket();
        })
    })
};


const getIo = () => {
    if (!io)
        throw new AppError("Io not initialized", 400)
    return io;
}