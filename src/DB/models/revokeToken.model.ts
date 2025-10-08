import mongoose from "mongoose";
import { Types } from "mongoose";



export interface IRevokeToken {
    userId: Types.ObjectId,
    tokenId: string,
    expireAt: Date
}
const revokeTokenSchema = new mongoose.Schema<IRevokeToken>({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    tokenId: { type: String, required: true },
    expireAt: { type: Date, required: true }
}, {
    timestamps: true,
})

const revokeTokenModel = mongoose.models.RevokeToken || mongoose.model<IRevokeToken>("RevokeToken", revokeTokenSchema);

export default revokeTokenModel;
