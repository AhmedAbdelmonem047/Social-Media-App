import { Router } from "express";
import PS from './post.service'
import { Validation } from "../../middleware/validation";
import * as PV from "./post.validation";
import { Authentication } from "../../middleware/authentication";
import { FileTypes, multerCloud } from "../../middleware/multer.cloud";
import commentRouter from "../comments/comment.controller";
export const postRouter = Router()

postRouter.use("/:postId/comments{/:commentId}", commentRouter);

postRouter.post('/', Authentication(), multerCloud({ fileTypes: FileTypes.image }).array("attachments", 2), Validation(PV.createPostSchema), PS.createPost);
postRouter.get('/paginated', Authentication(), PS.getPaginatedPosts);
postRouter.get('/all', Authentication(), PS.getPostsWithComments);
postRouter.patch('/:postId', Authentication(), Validation(PV.likePostSchema), PS.likePost);
postRouter.get('/:postId', Authentication(), Validation(PV.getPostSchema), PS.getPostById);
postRouter.patch('/update/:postId', Authentication(), multerCloud({ fileTypes: FileTypes.image }).array("attachments", 2), Validation(PV.updatePostSchema), PS.updatePost);
postRouter.patch('/freeze/:postId', Authentication(), Validation(PV.getPostSchema), PS.freezePost);
postRouter.patch('/unfreeze/:postId', Authentication(), Validation(PV.getPostSchema), PS.unfreezePost);
postRouter.delete('/delete/:postId', Authentication(), Validation(PV.getPostSchema), PS.deletePost);



export default postRouter;