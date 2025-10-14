"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const messageSchema = new mongoose_1.Schema({
    content: { type: String, required: true },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
const chatSchema = new mongoose_1.Schema({
    participants: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true }],
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    messages: [messageSchema],
    group: { type: String },
    groupImg: { type: String },
    roomId: { type: String }
}, { timestamps: true });
const chatModel = mongoose_1.models.Chat || (0, mongoose_1.model)("Chat", chatSchema);
exports.default = chatModel;
