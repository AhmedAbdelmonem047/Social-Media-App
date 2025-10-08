import { Request } from "express";
import multer, { FileFilterCallback } from "multer"
import { AppError } from "../utils/classError";
import os from "node:os"
import { v4 as uuidv4 } from "uuid";


export const FileTypes = {
    image: ["image/png", "image/jpg", "image/jpeg"],
    video: ["video/mp4"],
    audio: ["audio/mpeg", "audio/mp3"]
}

export enum StorageType {
    disk = "disk",
    cloud = "cloud"
}

export const multerCloud = ({
    fileTypes = FileTypes.image, storageType = StorageType.cloud, maxSize = 5
}: {
    fileTypes?: string[], storageType?: StorageType, maxSize?: number
}) => {
    const storage = storageType == StorageType.cloud ? multer.memoryStorage() : multer.diskStorage({
        destination: os.tmpdir(),
        filename(req: Request, file: Express.Multer.File, cb) {
            cb(null, `${uuidv4()}_${file.originalname}`);
        }
    });
    const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
        if (fileTypes!.includes(file.mimetype))
            cb(null, true);
        else
            return cb(new AppError("Invalid file type", 400));
    };
    const upload = multer({ storage, limits: { fileSize: 1024 * 1024 * maxSize }, fileFilter });
    return upload;
}