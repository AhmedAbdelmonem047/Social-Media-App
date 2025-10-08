import { Model } from "mongoose";
import { DbRepository } from "./db.repository";
import { IFriendRequest } from "../DB/models/friendRequest.model";

export class FriendRequestRepository extends DbRepository<IFriendRequest> {
    constructor(protected readonly model: Model<IFriendRequest>) {
        super(model);
    }
}