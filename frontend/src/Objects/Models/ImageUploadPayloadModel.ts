export class ImageUploadPayloadModel {
    public images: File[] = []; 
    public mimeType: string = 'image/png'; 
    public imageMetadata: string[] = [];
    public reflectionId: string | null = null;
    public reflectionKey: CryptoKey | null = null;
}