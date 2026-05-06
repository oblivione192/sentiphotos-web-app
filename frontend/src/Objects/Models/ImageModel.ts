import { Dayjs } from "dayjs"; 

export class ImageModel {
    public imageId: string | null = null; 
    public mimeType: string | null = null;
    public encrypted: boolean = false; 
    public url: string | null = null; 
    public encryptedMetadata: string | null = null;
    public metadataNonce: string | null = null;
    public encryptedImageKey: string | null = null;
    public imageKeyNonce: string | null = null;  
    public blobNonce: string | null = null; 
    public createdAt?: Dayjs | null =  null; 
    public updatedAt?: Dayjs | null = null;  
    

    
    public toObject(): object { 
        return {
            imageId: this.imageId,
            mimeType: this.mimeType,
            encrypted: this.encrypted,
            encryptedMetadata: this.encryptedMetadata,
            metadataNonce: this.metadataNonce,
            encryptedImageKey: this.encryptedImageKey,
            imageKeyNonce: this.imageKeyNonce,
            blobNonce: this.blobNonce, 
            createdAt: this.createdAt ? this.createdAt.toISOString() : null,
            updatedAt: this.updatedAt ? this.updatedAt.toISOString() : null
        };
    }
}
