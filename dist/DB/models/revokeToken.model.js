"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const revokeTokenSchema = new mongoose_1.default.Schema({
    userId: { type: mongoose_1.default.Schema.Types.ObjectId, required: true, ref: "User" },
    tokenId: { type: String, required: true },
    expireAt: { type: Date, required: true }
}, {
    timestamps: true,
});
const revokeTokenModel = mongoose_1.default.models.RevokeToken || mongoose_1.default.model("RevokeToken", revokeTokenSchema);
exports.default = revokeTokenModel;
