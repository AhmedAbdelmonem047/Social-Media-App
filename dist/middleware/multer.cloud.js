"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.multerCloud = exports.StorageType = exports.FileTypes = void 0;
const multer_1 = __importDefault(require("multer"));
const classError_1 = require("../utils/classError");
const node_os_1 = __importDefault(require("node:os"));
const uuid_1 = require("uuid");
exports.FileTypes = {
    image: ["image/png", "image/jpg", "image/jpeg"],
    video: ["video/mp4"],
    audio: ["audio/mpeg", "audio/mp3"]
};
var StorageType;
(function (StorageType) {
    StorageType["disk"] = "disk";
    StorageType["cloud"] = "cloud";
})(StorageType || (exports.StorageType = StorageType = {}));
const multerCloud = ({ fileTypes = exports.FileTypes.image, storageType = StorageType.cloud, maxSize = 5 }) => {
    const storage = storageType == StorageType.cloud ? multer_1.default.memoryStorage() : multer_1.default.diskStorage({
        destination: node_os_1.default.tmpdir(),
        filename(req, file, cb) {
            cb(null, `${(0, uuid_1.v4)()}_${file.originalname}`);
        }
    });
    const fileFilter = (req, file, cb) => {
        if (fileTypes.includes(file.mimetype))
            cb(null, true);
        else
            return cb(new classError_1.AppError("Invalid file type", 400));
    };
    const upload = (0, multer_1.default)({ storage, limits: { fileSize: 1024 * 1024 * maxSize }, fileFilter });
    return upload;
};
exports.multerCloud = multerCloud;
