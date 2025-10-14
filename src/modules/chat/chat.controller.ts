import { Router } from "express";
import { Authentication } from "../../middleware/authentication";
import { ChatService } from "./chat.service";
import * as CV from "./chat.validation";
import { Validation } from "../../middleware/validation";

const chatRouter = Router({ mergeParams: true });
const CS: ChatService = new ChatService()

chatRouter.get("/", Authentication(), Validation(CV.getChatSchema), CS.getChat)

export default chatRouter;