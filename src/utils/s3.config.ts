import { StorageType } from './../middleware/multer.cloud';
import { DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand, ListObjectsV2Command, ObjectCannedACL, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { v4 as uuvid4 } from 'uuid';
import { createReadStream } from "fs"
import { AppError } from './classError';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// ============ S3Client Config ========= //
export const s3Client = () => {
    return new S3Client({
        region: process.env.AWS_REGION!,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
        }
    })
}
// ====================================== //

// ============= Upload File ============ //
export const uploadFile = async (
    {
        storeType = StorageType.cloud,
        Bucket = process.env.AWS_BUCKET_NAME,
        path = "general",
        ACL = "private" as ObjectCannedACL,
        file
    }: {
        storeType?: StorageType,
        Bucket?: string,
        path?: string,
        ACL?: ObjectCannedACL,
        file: Express.Multer.File
    }
): Promise<string> => {
    const command = new PutObjectCommand({
        Bucket,
        ACL,
        Key: `${process.env.APPLICATION_NAME}/${path}/${uuvid4()}_${file.originalname}}`,
        Body: storeType === StorageType.cloud ? file.buffer : createReadStream(file.path),
        ContentType: file.mimetype
    })
    await s3Client().send(command);
    if (!command.input.Key)
        throw new AppError("Failed to upload file to s3", 500);
    return command.input.Key;
}
// ====================================== //

// ========== Upload Large File ========= //
export const uploadLargeFile = async ({
    storeType = StorageType.cloud,
    Bucket = process.env.AWS_BUCKET_NAME!,
    path = "general",
    ACL = "private" as ObjectCannedACL,
    file
}: {
    storeType?: StorageType,
    Bucket?: string,
    path?: string,
    ACL?: ObjectCannedACL,
    file: Express.Multer.File
}): Promise<string> => {
    const upload = new Upload({
        client: s3Client(),
        params: {
            Bucket,
            ACL,
            Key: `${process.env.APPLICATION_NAME}/${path}/${uuvid4()}_${file.originalname}}`,
            Body: storeType === StorageType.cloud ? file.buffer : createReadStream(file.path),
            ContentType: file.mimetype
        }
    });

    upload.on("httpUploadProgress", (progress) => {
        console.log(progress);
    });
    const { Key } = await upload.done()
    if (!Key)
        throw new AppError("Failed to upload file to s3", 500);
    return Key;
}
// ====================================== //

// ============ Upload Files ============ //
export const uploadFiles = async (
    {
        storeType = StorageType.cloud,
        Bucket = process.env.AWS_BUCKET_NAME!,
        path = "general",
        ACL = "private" as ObjectCannedACL,
        files,
        useLarge = false
    }: {
        storeType?: StorageType,
        Bucket?: string,
        path: string,
        ACL?: ObjectCannedACL,
        files: Express.Multer.File[],
        useLarge?: boolean
    }
): Promise<string[]> => {
    let urls: string[] = [];
    if (useLarge)
        urls = await Promise.all(files.map(file => uploadLargeFile({ storeType, Bucket, path, ACL, file })));
    else
        urls = await Promise.all(files.map(file => uploadFile({ storeType, Bucket, path, ACL, file })));
    return urls;
}
// ====================================== //

// ===== Upload Files Presigned URL ===== //
export const createUploadFilePresignedURL = async (
    {
        Bucket = process.env.AWS_BUCKET_NAME!,
        path = "general",
        originalname,
        ContentType,
        expiresIn = 60 * 60
    }: {
        Bucket?: string,
        path: string,
        originalname: string,
        ContentType: string,
        expiresIn?: number
    }
) => {
    const Key = `${process.env.APPLICATION_NAME}/${path}/${uuvid4()}_presigned_${originalname}}`;
    const command = new PutObjectCommand({
        Bucket,
        Key,
        ContentType
    })
    const url = await getSignedUrl(s3Client(), command, { expiresIn });
    return { url, Key };
}
// ====================================== //

// =============== Get File ============= //
export const getFile = async (
    {
        Bucket = process.env.AWS_BUCKET_NAME,
        Key
    }: {
        Bucket?: string,
        Key: string
    }
) => {
    const command = new GetObjectCommand({
        Bucket,
        Key
    })
    return await s3Client().send(command);
}
// ====================================== //

// ======= Get File Presigned URL ======= //
export const createGetFilePresignedURL = async (
    {
        Bucket = process.env.AWS_BUCKET_NAME,
        Key,
        expiresIn = 60,
        downloadName
    }: {
        Bucket?: string,
        Key: string,
        expiresIn?: number,
        downloadName?: string | undefined
    }
) => {
    const command = new GetObjectCommand({
        Bucket,
        Key,
        ResponseContentDisposition: downloadName ? `attachment: filename="${downloadName}"` : undefined
    })
    const url = await getSignedUrl(s3Client(), command, { expiresIn });
    return url;
}
// ====================================== //

// ============= Delete File ============ //
export const deleteFile = async (
    {
        Bucket = process.env.AWS_BUCKET_NAME,
        Key
    }: {
        Bucket?: string,
        Key: string
    }
) => {
    const command = new DeleteObjectCommand({
        Bucket,
        Key
    })
    return await s3Client().send(command);
}
// ====================================== //

// ============ Delete Files ============ //
export const deleteFiles = async (
    {
        Bucket = process.env.AWS_BUCKET_NAME,
        urls,
        Quiet = false
    }: {
        Bucket?: string,
        urls: string[],
        Quiet?: boolean
    }
) => {
    const command = new DeleteObjectsCommand({
        Bucket,
        Delete: { Objects: urls.map(url => ({ Key: url })), Quiet }
    })
    return await s3Client().send(command);
}
// ====================================== //

// ============= List Files ============= //
export const listFiles = async (
    {
        Bucket = process.env.AWS_BUCKET_NAME,
        path
    }: {
        Bucket?: string,
        path: string
    }
) => {
    const command = new ListObjectsV2Command({
        Bucket,
        Prefix: `${process.env.APPLICATION_NAME!}/${path}`
    })
    return await s3Client().send(command);
}
// ====================================== //