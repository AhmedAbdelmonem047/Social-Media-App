import { Model } from "mongoose";
import { DbRepository } from "./db.repository";
import { IComment } from "../DB/models/comment.model";

export class CommentRepository extends DbRepository<IComment> {
    constructor(protected readonly model: Model<IComment>) {
        super(model);
    }
    // async deleteWithReplies(filter: any) {
    //     const queue = await this.model.find(filter).select("_id");
    //     while (queue.length > 0) {
    //         const current = queue.pop();
    //         const replies = await this.model.find({ onModel: "Comment", refId: current!._id }).select("_id");
    //         queue.push(...replies);
    //         await this.model.deleteOne({ _id: current!._id });
    //     }
    // };
}