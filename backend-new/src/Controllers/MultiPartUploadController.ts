import { Errors } from "../Constants.js";
import { AuthenticatedRequest } from "../Middlewares/Authentication.js";
import { Response } from "express"; 
import S3Service from "../Services/S3Service.js";
import { v4 as uuidv4 } from "uuid";
export class MultiPartUploadController { 

     public static async getUploadUrl(req: AuthenticatedRequest, res: Response): Promise<Response> {
        const userId = req.userId;
        const { reflectionId,} = req.params;
        try {
            const key = `${userId}/${reflectionId}/${uuidv4()}`;
            const url = await S3Service.getSignedUploadUrl(key);
            return res.json({ key, url });
        } catch (err) {
            console.error("Error getting signed upload URL:", err);
            switch(err?.message){
                case Errors.INVALID_KEY_FORMAT:
                    return res.status(400).json({ error: Errors.INVALID_KEY_FORMAT });
                case Errors.UPLOAD_FAILED:
                    return res.status(500).json({ error: Errors.UPLOAD_FAILED });
                default:
                    console.error("Unexpected error getting signed upload URL:", err);
                    return res.status(500).json({ error: "An unexpected error occurred while getting signed upload URL" });
            }
        }
    } 

     public static async initiateUpload(req: AuthenticatedRequest, res: Response): Promise<Response> {
        const userId = req.userId;
        const { reflectionId } = req.params; 
        console.log(reflectionId); 
        try {
            const key = `${userId}/${reflectionId}/${uuidv4()}`;
            const uploadId = await S3Service.createMultipartUpload(key);
            //should return an uploadId and presigned urls for each part
            return res.json({ uploadId, key });
        } catch (err) {
            console.error("Error initiating multipart upload:", err);
                switch(err?.message){ 
                    case Errors.INVALID_KEY_FORMAT:
                        return res.status(400).json({ error: Errors.INVALID_KEY_FORMAT });
                    case Errors.UPLOAD_FAILED:
                        return res.status(500).json({ error: Errors.UPLOAD_FAILED });
                    default:
                        console.error("Unexpected error initiating multipart upload:", err);
                        return res.status(500).json({ error: "An unexpected error occurred while initiating multipart upload" });
                }
        }
    }   

    public static async getMultipartUploadParts(req: AuthenticatedRequest, res: Response): Promise<Response> {
        const userId = req.userId;
        const { reflectionId, uploadId } = req.params;
        try {
            const key = `${userId}/${reflectionId}`;
            const parts = await S3Service.listParts(key, uploadId as string);
            return res.json({ parts });
        } catch (err) {
            console.error("Error listing parts for multipart upload:", err);
            switch(err?.message){
                case Errors.INVALID_KEY_FORMAT:
                    return res.status(400).json({ error: Errors.INVALID_KEY_FORMAT });
                case Errors.UPLOAD_FAILED:
                    return res.status(500).json({ error: Errors.UPLOAD_FAILED });
                default:
                    console.error("Unexpected error listing parts for multipart upload:", err);
                    return res.status(500).json({ error: "An unexpected error occurred while listing parts for multipart upload" });
            }
        }
    }

    public static async getPresignedUrls(req: AuthenticatedRequest, res: Response): Promise<Response> {
        const {key, uploadId, partNumbers} = req.body;
        if (!key || !uploadId || !partNumbers || !Array.isArray(partNumbers)) {
            return res.status(400).json({ error: "Missing or invalid parameters. 'key', 'uploadId', and 'partNumbers' (array) are required." });
        }
        try {
            const urls = await Promise.all(partNumbers.map((partNumber: number) => S3Service.getUploadPartPresignedUrl(key, uploadId, partNumber)));
            return res.json({ urls });
        } catch (err) {
            console.error("Error getting presigned URLs for multipart upload:", err);   
            switch(err?.message){
                case Errors.INVALID_KEY_FORMAT:
                    return res.status(400).json({ error: Errors.INVALID_KEY_FORMAT });
                case Errors.UPLOAD_FAILED:
                    return res.status(500).json({ error: Errors.UPLOAD_FAILED });
                default:
                    console.error("Unexpected error getting presigned URLs for multipart upload:", err);
                    return res.status(500).json({ error: "An unexpected error occurred while getting presigned URLs for multipart upload" });
            }
        }
    } 

    public static async abortUpload(req: AuthenticatedRequest, res: Response): Promise<Response> {
        const {key, uploadId} = req.body;
        if (!key || !uploadId) {
            return res.status(400).json({ error: "Missing parameters. 'key' and 'uploadId' are required." });
        }
        try {            
            await S3Service.abortMultipartUpload(key, uploadId);
            return res.json({ message: "Multipart upload aborted successfully." });
        } catch (err) {
            console.error("Error aborting multipart upload:", err);
            switch(err?.message){
                case Errors.INVALID_KEY_FORMAT:
                    return res.status(400).json({ error: Errors.INVALID_KEY_FORMAT });
                case Errors.UPLOAD_FAILED:
                    return res.status(500).json({ error: Errors.UPLOAD_FAILED });
                default:
                    console.error("Unexpected error aborting multipart upload:", err);
                    return res.status(500).json({ error: "An unexpected error occurred while aborting multipart upload" });
            }
        }
    } 

    public static async listParts(req: AuthenticatedRequest, res: Response): Promise<Response> {
        const {key, uploadId} = req.body;
        if (!key || !uploadId) {
            return res.status(400).json({ error: "Missing parameters. 'key' and 'uploadId' are required." });
        }
        try {            
            const parts = await S3Service.listParts(key, uploadId);
            return res.json({ parts });
        } catch (err) {
            console.error("Error listing parts for multipart upload:", err);
            switch(err?.message){
                case Errors.INVALID_KEY_FORMAT:
                    return res.status(400).json({ error: Errors.INVALID_KEY_FORMAT });
                case Errors.UPLOAD_FAILED:
                    return res.status(500).json({ error: Errors.UPLOAD_FAILED });
                default:
                    console.error("Unexpected error listing parts for multipart upload:", err);
                    return res.status(500).json({ error: "An unexpected error occurred while listing parts for multipart upload" });
            }   
        }
    } 



    public static async completeUpload(req: AuthenticatedRequest, res: Response): Promise<Response> {
        const {key, uploadId, parts} = req.body;
        if (!key || !uploadId || !parts || !Array.isArray(parts)) {
            return res.status(400).json({ error: "Missing or invalid parameters. 'key', 'uploadId', and 'parts' (array) are required." });
        }
        try {            
            await S3Service.completeMultipartUpload(key, uploadId, parts);
            return res.json({ message: "Multipart upload completed successfully." });
        } catch (err) {
            console.error("Error completing multipart upload:", err);
            switch(err?.message){
                case Errors.INVALID_KEY_FORMAT:
                    return res.status(400).json({ error: Errors.INVALID_KEY_FORMAT });
                case Errors.UPLOAD_FAILED:
                    return res.status(500).json({ error: Errors.UPLOAD_FAILED });
                default:
                    console.error("Unexpected error completing multipart upload:", err);
                    return res.status(500).json({ error: "An unexpected error occurred while completing multipart upload" });
            }
        }
    }
}