"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.friendRequestSchema = exports.RequestActionEnum = void 0;
const mongoose_1 = require("mongoose");
var RequestActionEnum;
(function (RequestActionEnum) {
    RequestActionEnum["accept"] = "accept";
    RequestActionEnum["delete"] = "delete";
})(RequestActionEnum || (exports.RequestActionEnum = RequestActionEnum = {}));
exports.friendRequestSchema = new mongoose_1.Schema({
    sentFrom: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    sentTo: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    acceptedAt: { type: Date }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true }, strictQuery: true });
exports.friendRequestSchema.pre(["findOne", "find"], function (next) {
    const query = this.getQuery();
    const { paranoid, ...rest } = query;
    if (paranoid === false)
        this.setQuery({ ...rest });
    else
        this.setQuery({ ...rest, deletedAt: { $exists: false } });
    next();
});
const friendRequestModel = mongoose_1.models.FriendRequest || (0, mongoose_1.model)("FriendRequest", exports.friendRequestSchema);
exports.default = friendRequestModel;
