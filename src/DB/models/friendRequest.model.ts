import { model, models, Schema, Types } from "mongoose";

export enum RequestActionEnum{
    accept = "accept",
    delete = "delete"
}

export interface IFriendRequest {
    sentFrom: Types.ObjectId,
    sentTo: Types.ObjectId,
    acceptedAt: Date
}

export const friendRequestSchema = new Schema<IFriendRequest>({
    sentFrom: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sentTo: { type: Schema.Types.ObjectId, ref: "User", required: true },
    acceptedAt: { type: Date }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true }, strictQuery: true });


friendRequestSchema.pre(["findOne", "find"], function (next) {
    const query = this.getQuery();
    const { paranoid, ...rest } = query;
    if (paranoid === false)
        this.setQuery({ ...rest });
    else
        this.setQuery({ ...rest, deletedAt: { $exists: false } });
    next();
});

const friendRequestModel = models.FriendRequest || model<IFriendRequest>("FriendRequest", friendRequestSchema);

export default friendRequestModel;