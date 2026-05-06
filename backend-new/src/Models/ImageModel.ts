import { AuthenticatedRequest } from "../Middlewares/Authentication.js";
import { AuditableModel } from "./AuditableModel.js"; 


export class ImageModel extends AuditableModel{ 

    public imageId: string;
    public mimeType: string;
    public encrypted: boolean;
    public encryptedImageKey?: string;
    public blobNonce?: string; //nonce for the blob content
    public imageKeyNonce?: string; //nonce for the key 
    public url?: string;
   
    public static createMultipleFromRequest(request: AuthenticatedRequest): ImageModel[]{
         const metadataList = request.body.metadata as {
            imageId: string; 
            mimeType: string; 
            encryptedImageKey: string; 
            encryptedImageKeyNonce: string; 
            blobNonce: string; 
            encrypted: string;  
         }[]; 
        
         return metadataList.map((metadata)=>{
             const imageModel = new ImageModel(); 

             imageModel.imageId = metadata.imageId; 
             imageModel.mimeType = metadata.mimeType;  
             imageModel.encryptedImageKey = metadata.encryptedImageKey;  
             imageModel.imageKeyNonce = metadata.encryptedImageKeyNonce;   
             imageModel.blobNonce = metadata.blobNonce; 
             imageModel.encrypted = Boolean(metadata.encrypted); 
             
            
             return imageModel; 
         }); 
    }

    public static createFromRequest(request: AuthenticatedRequest): ImageModel {
        const imageModel = new ImageModel();

        const body = request.body ?? {};

        imageModel.imageId = body.imageId ?? "";
        imageModel.mimeType = body.mimeType ?? "";
        imageModel.encrypted = Boolean(body.encrypted);

        imageModel.encryptedImageKey = body.encryptedImageKey ?? undefined;
        imageModel.imageKeyNonce = body.imageKeyNonce ?? undefined; 


        return imageModel; 
    }
    
    constructor( ){
        super();
    }   
    
    public getImageId(): string {
        return this.imageId;
    }

    public toObject(): object { 
        return {
            imageId: this.imageId,
            mimeType: this.mimeType,
            encrypted: this.encrypted,
            encryptedImageKey: this.encryptedImageKey,
            imageKeyNonce: this.imageKeyNonce,  
            blobNonce: this.blobNonce, 
            ...this.getAuditInfo()
        };
    }
} 