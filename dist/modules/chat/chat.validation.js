"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessageSchema = exports.getChatSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const generalRules_js_1 = require("../../utils/generalRules.js");
exports.getChatSchema = {
    params: zod_1.default.strictObject({
        userId: generalRules_js_1.generalRules.id,
    }),
};
exports.sendMessageSchema = {
    body: zod_1.default.strictObject({
        content: [String],
        sendTo: generalRules_js_1.generalRules.id
    })
};
