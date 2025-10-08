import { Router } from "express";
import CS from './comment.service'
import { Validation } from "../../middleware/validation";
import * as CV from "./comment.validation";
import { Authentication } from "../../middleware/authentication";
import { FileTypes, multerCloud } from "../../middleware/multer.cloud";
const commentRouter = Router({ mergeParams: true })

commentRouter.post('/', Authentication(), multerCloud({ fileTypes: FileTypes.image }).array("attachments", 2), Validation(CV.createCommentSchema), CS.createComment);
commentRouter.get('/', Authentication(), Validation(CV.getCommentSchema), CS.getCommentById);
commentRouter.get('/withReplies', Authentication(), Validation(CV.getCommentSchema), CS.getCommentWithReplies);
commentRouter.patch('/update', Authentication(), multerCloud({ fileTypes: FileTypes.image }).array("attachments", 2), Validation(CV.updateCommentSchema), CS.updateComment);
commentRouter.patch('/freeze/:postId', Authentication(), Validation(CV.getCommentSchema), CS.freezeComment);
commentRouter.patch('/unfreeze/:postId', Authentication(), Validation(CV.getCommentSchema), CS.unfreezeComment);
commentRouter.delete('/delete/:postId', Authentication(), Validation(CV.getCommentSchema), CS.deleteComment);


export default commentRouter;