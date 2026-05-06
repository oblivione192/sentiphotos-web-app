import dayjs from "dayjs";
import { ImageModel } from "../Models/ImageModel";
import { ImageUploadPayloadModel } from "../Models/ImageUploadPayloadModel";
import type { ImageFilterModel } from "../Filters/ImageFilter";
import EncryptionService from "../../Services/Encryption";
import { UploadManager } from "../Manager/UploadManager";
import type { AxiosInstance } from "axios";
import pLimit from "p-limit";

type ImageResponseModel = { 
    url? : string | null; 
    imageId?: string | null;
    mimeType?: string | null;
    encrypted?: boolean;
    encryptedMetadata?: string | null;
    metadataNonce?: string | null;
    encryptedImageKey?: string | null;
    imageKeyNonce?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
};

type ImageQueryModel = {
    userId?: string;
    imageId?: string;
    reflectionId?: string;
    page?: number;
    limit?: number;
};

export default class ImageApi {
    private static url = "/api/images";
    private static axios: AxiosInstance;

    // ✅ Centralized client access
    private static get client(): AxiosInstance {
        if (!this.axios) {
            throw new Error("ImageApi not initialized. Call ImageApi.init(axiosInstance)");
        }
        return this.axios;
    }

    public static init(axiosInstance: AxiosInstance) {
        this.axios = axiosInstance;
    }

    private static toImageModel(imageData: ImageResponseModel): ImageModel {
        const image = new ImageModel();
        image.blobNonce = imageData.blobNonce ?? null; 
        image.imageId = imageData.imageId ?? null;
        image.url = imageData.url ?? null; 
        image.mimeType = imageData.mimeType ?? null;
        image.encrypted = imageData.encrypted ?? false;
        image.encryptedMetadata = imageData.encryptedMetadata ?? null;
        image.metadataNonce = imageData.metadataNonce ?? null;
        image.encryptedImageKey = imageData.encryptedImageKey ?? null;
        image.imageKeyNonce = imageData.imageKeyNonce ?? null;
        image.createdAt = imageData.createdAt ? dayjs(imageData.createdAt) : null;
        image.updatedAt = imageData.updatedAt ? dayjs(imageData.updatedAt) : null;
        return image;
    }

    private static buildFilterParams(filter?: Partial<ImageFilterModel>): ImageQueryModel {
        const params: ImageQueryModel = {};

        if (!filter) return params;

        if (filter.userId) params.userId = filter.userId;
        if (filter.imageId) params.imageId = filter.imageId;
        if (filter.reflectionId) params.reflectionId = filter.reflectionId;
        if (filter.page !== undefined) params.page = filter.page;
        if (filter.limit !== undefined) params.limit = filter.limit;

        return params;
    }

    // =========================================================
    // Upload
    // =========================================================

    public static async uploadImages(
        imageUploadPayload: ImageUploadPayloadModel
    ): Promise<ImageModel[]> {
        if (!imageUploadPayload.reflectionId) {
            throw new Error("Reflection id is required for image uploads");
        }

        const reflectionId = imageUploadPayload.reflectionId;
        const reflectionKey = imageUploadPayload.reflectionKey ?? null;
        const metadataList = imageUploadPayload.imageMetadata ?? [];

        try {
            const limit = pLimit(3);

            let encryptedFiles: { 
                mimeType: string; 
                imageId: string; 
                blob: Blob;
                encryptedImageKey: string;
                imageKeyNonce: string;
                blobNonce: string;
            }[] = [];

            // -----------------------------
            // Encryption path
            // -----------------------------
            if (reflectionKey) {
                encryptedFiles = await Promise.all(
                    imageUploadPayload.images.map((image, index) =>
                        limit(async () => { 
                            const mimeType =  image.type;  
                            const encryptedImage = await EncryptionService.encryptImage({
                                reflectionKey,
                                fileData: image,
                            });

                            const uint8 = encryptedImage.encryptedFile;

                            const buffer = new ArrayBuffer(uint8.byteLength);
                            new Uint8Array(buffer).set(uint8);

                            const encryptedBlob = new Blob([buffer], {
                                type: "application/octet-stream",
                            });
                             
                            const [uploadedImageId] = await new UploadManager(
                                 this.axios, 
                                 [encryptedBlob]
                            ).uploadAllFiles(
                                 reflectionId, 
                                 "application/octet-stream", 
                                 10*1024*1024
                            )
                            
                        
                            return {  
                                imageId: uploadedImageId,  
                                mimeType: mimeType, 
                                blob: encryptedBlob,
                                encryptedImageKey: EncryptionService.toBase64(
                                    encryptedImage.encryptedFileKey
                                ),
                                imageKeyNonce: EncryptionService.toBase64(
                                    encryptedImage.fileKeyNonce
                                ),
                                blobNonce: EncryptionService.toBase64(
                                    encryptedImage.fileNonce
                                ),
                            };
                        })
                    )
                );
            } else {
                // -----------------------------
                // Plain upload path
                // -----------------------------
                encryptedFiles = imageUploadPayload.images.map((image, index) => ({
                    blob: image,
                    metadata: metadataList[index] ?? "",
                }));
            }

    



            // -----------------------------
            // Save metadata (FIXED: uses injected client)
            // ----------------------------- 

            const metadataPayload: {
                imageId: string;  
                mimeType: string; 
                encryptedImageKey: string;
                encryptedImageKeyNonce: string; 
                blobNonce: string;  
                encrypted: boolean; 
            }[] = encryptedFiles.map((f)=>{
               
                 return { 
                     imageId: f.imageId,  
                     mimeType:f.mimeType,  
                     encryptedImageKey: f.encryptedImageKey,   
                     encryptedImageKeyNonce: f.imageKeyNonce, 
                     blobNonce: f.blobNonce,
                     encrypted: true,  
                 }
             })



            const response = await this.client.post(
              `${this.url}/${reflectionId}/metadata`,
              { 
                metadata: metadataPayload 
              }
            );  

            return (response.data.images ?? []).map((img: ImageResponseModel) =>
                this.toImageModel(img)
            );
        } catch (error: any) {
            console.error(error); 
            console.error("Error uploading image:", error.response?.data || error.message);
            throw new Error("Failed to upload images");
        }
    }

    public static async uploadImage(
        imageUploadPayload: ImageUploadPayloadModel
    ): Promise<ImageModel> {
        const images = await this.uploadImages(imageUploadPayload);

        if (!images[0]) {
            throw new Error("No image was uploaded");
        }

        return images[0];
    }

    // =========================================================
    // Delete
    // =========================================================

    public static async deleteImage(reflectionId: string, imageId: string): Promise<void> {
        try {
            await this.client.delete(`${this.url}/${reflectionId}/${imageId}`);
        } catch (error) {
            console.error("Error deleting image:", error);
            throw new Error("Failed to delete image");
        }
    }

    // =========================================================
    // Get single image
    // =========================================================

    public static async getImage(
        reflectionId: string,
        imageId: string
    ): Promise<ImageModel> {
        try { 

            const response = await this.client.get(
                `${this.url}/${reflectionId}/${imageId}`
            );  

            const imageUrl: string = await this.client.get(
                 `${this.url}/presignedUrl/${reflectionId}/${imageId}`
            ).then((response)=>response.data)


            response.data = {...response.data,url: imageUrl}


            return this.toImageModel(response.data);
        } catch (error) {
            console.error(error);
            throw new Error("Failed to fetch image");
        }
    } 

   public static async decryptImage(
        reflectionKey: CryptoKey, 
        image: ImageModel
    ): Promise<ArrayBuffer> {

        console.log(image); 

        if (!image.url || !image.encryptedImageKey || !image.imageKeyNonce || !image.blobNonce) {
            throw new Error("Missing required image encryption fields");
        }

        const response = await this.client.get<ArrayBuffer>(image.url, {
            responseType: "arraybuffer",
        });

        const encryptedFileBuffer = new Uint8Array(response.data);

        const decryptedBytes = await EncryptionService.decryptImage(reflectionKey, {
            encryptedFileKey: EncryptionService.fromBase64(image.encryptedImageKey),
            fileKeyNonce: EncryptionService.fromBase64(image.imageKeyNonce),
            encryptedFile: encryptedFileBuffer,
            fileNonce: EncryptionService.fromBase64(image.blobNonce),
        });

        console.log("Decrypted bytes: ", decryptedBytes); 

        // ✅ Return ArrayBuffer directly
        return decryptedBytes.buffer.slice(
            decryptedBytes.byteOffset,
            decryptedBytes.byteOffset + decryptedBytes.byteLength
        );
}

    // =========================================================
    // Get all images for reflection
    // =========================================================

    public static async getAllImagesForReflection(
        userId: string,
        reflectionId: string
    ): Promise<ImageModel[]> {
        try {
            const response = await this.client.get(`${this.url}/imageMeta`, {
                params: { userId, reflectionId },
            });

            return response.data.map((img: ImageResponseModel) =>
                this.toImageModel(img)
            );
        } catch (error) {
            console.error("Error fetching images for reflection:", error);
            throw new Error("Failed to fetch images for reflection");
        }
    }

    // =========================================================
    // Query images
    // =========================================================

    public static async indexImages(
        filter?: Partial<ImageFilterModel>
    ): Promise<ImageModel[]> {
        try { 
            if(filter == undefined){ 
                return []; 
            } 

            const params = this.buildFilterParams(filter);

            const response = await this.client.get(`${this.url}/imageMeta`, {
                params,
            });  

            return await Promise.all(
                 response.data.map( 
                     async(img: ImageResponseModel)=>{
                           
                       img.url = await this.client.get(
                        `${this.url}/presignedUrl/${filter.reflectionId}/${img.imageId}`
                       ).then((response)=>response.data)

                        return this.toImageModel(img)
                     }
                 )
            ); 

        } catch (error) {
            console.error("Error fetching images:", error);
            throw new Error("Failed to fetch images");
        }
    }
}