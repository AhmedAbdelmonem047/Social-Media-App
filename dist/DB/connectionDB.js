"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const connectionDB = async () => {
    mongoose_1.default.connect(process.env.DB_URL).then(() => {
        console.log(`Connected successfully to DB ${process.env.DB_URL}`);
    }).catch((error) => {
        console.log(`Failed to connect to DB`, error);
    });
};
exports.default = connectionDB;
