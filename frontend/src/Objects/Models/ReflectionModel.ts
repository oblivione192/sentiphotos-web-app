import { ImageModel } from "./ImageModel";  
import { Dayjs } from "dayjs";
import EncryptionService from "../../Services/Encryption"; 

type DecryptedReflectionModel = { 
     reflectionId: string; 
     title: string; 
     description: string; 
} 

export class ReflectionModel{
    public reflectionId: string | null = null;
    //title and description here are purely for input purposes. 
    public title: string | null = null;
    public description: string | null = null; 
    public encrypted: boolean = false;
    public encryptedMetadata?: string | null = null;
    public metadataNonce?: string | null = null; 
    public encryptedReflectionKey?: string | null = null; 
    private isDecrypted: boolean = false; 
    public reflectionKeyNonce?: string | null = null;
    public images: ImageModel[] = [];
    public createdAt?: Dayjs | null = null;
    public updatedAt?: Dayjs | null = null;  
    
    public simplifiedToObject(): object {
        return {
            reflectionId: this.reflectionId,
            title: this.title,
            description: this.description,
            encrypted: this.encrypted,
            createdAt: this.createdAt ? this.createdAt.toISOString() : null,
            updatedAt: this.updatedAt ? this.updatedAt.toISOString() : null
        };
    }  

   
    public toObject(): object {
        return {
            reflectionId: this.reflectionId,
            title: this.title,
            description: this.description, 
            encrypted: this.encrypted,
            encryptedMetadata: this.encryptedMetadata,
            metadataNonce: this.metadataNonce,
            encryptedReflectionKey: this.encryptedReflectionKey,
            reflectionKeyNonce: this.reflectionKeyNonce,
            images: this.images.map(image => image.toObject()),
            createdAt: this.createdAt ? this.createdAt.toISOString() : null,
            updatedAt: this.updatedAt ? this.updatedAt.toISOString() : null
        };
    } 

   public isReflectionDecrypted(): boolean{
      return this.isDecrypted; 
   } 

   public async getReflectionKey(masterKey: CryptoKey): Promise<CryptoKey>{
    
     const result = await EncryptionService.decryptCollection(masterKey,
         {
            encryptedReflectionKey: EncryptionService.fromBase64(this.encryptedReflectionKey!),
            reflectionKeyNonce: EncryptionService.fromBase64(this.reflectionKeyNonce!),
            encryptedMetadata: EncryptionService.fromBase64(this.encryptedMetadata!),
            metadataNonce: EncryptionService.fromBase64(this.metadataNonce!),
         }
     )  

     return result.reflectionKey; 
   }

   public async toDecryptedModel(masterKey: CryptoKey): Promise<DecryptedReflectionModel> {

        const encryptedReflectionKey = this.encryptedReflectionKey;
        const reflectionKeyNonce = this.reflectionKeyNonce;
        const encryptedMetadata = this.encryptedMetadata;
        const metadataNonce = this.metadataNonce; 
        const reflectionId = this.reflectionId; 

        if (
            !encryptedReflectionKey ||
            !reflectionKeyNonce ||
            !encryptedMetadata ||
            !metadataNonce || 
            !reflectionId 
        ) {
            throw new Error("The credentials for encryption are missing.");
        }

        const decrypted = await EncryptionService.decryptCollection(masterKey, {
            encryptedReflectionKey: EncryptionService.fromBase64(encryptedReflectionKey),
            reflectionKeyNonce: EncryptionService.fromBase64(reflectionKeyNonce),
            encryptedMetadata: EncryptionService.fromBase64(encryptedMetadata),
            metadataNonce: EncryptionService.fromBase64(metadataNonce),
        });

        const metadata = decrypted.metadata as DecryptedReflectionModel;  
       
        metadata.reflectionId =  reflectionId!; 
   
        console.log(metadata); 
        
        return metadata; 
    }
}   
