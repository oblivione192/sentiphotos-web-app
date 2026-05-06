import S3Service from "../../Services/S3Service.js";         
import { Buffer } from "buffer";     
import { ImageModel } from "../../Models/ImageModel.js";   
import { ImageRepository } from "../../Repositories/ImageRepository.js";
import { ImageFilter } from "../../Models/Filters/ImageFilter.js"; 
import { Errors } from "../../Constants.js";
export class ImageController{        

     
     
     public static async addImageMetadata(
        userId: string,
        reflectionId: string,
        imageModel: ImageModel
     ): Promise<ImageModel>{ 

        if(!userId || !reflectionId || !imageModel){
            throw new Error("Missing required parameters: userId, reflectionId, and imageModel are all required");
        }   

        imageModel.url = await S3Service.getImage(`${userId}/${reflectionId}/${imageModel.imageId}`); 

        await ImageRepository.saveImageMetadata(userId, reflectionId, imageModel); 
  
        return imageModel; 
        
     }   

     public static async getSignedUrlForImage( 
        userId: string,
        reflectionId: string,
        imageId: string
     ): Promise<string>{
         const key = `${userId}/${reflectionId}/${imageId}`;  
         
         const url = await S3Service.getImage(key); 

         return url; 
     }

      public static async updateImageMetadata(
        userId: string,
        reflectionId: string,
        imageModel: ImageModel
     ): Promise<void>{ 

        if(!userId || !reflectionId || !imageModel){
            throw new Error("Missing required parameters: userId, reflectionId, and imageModel are all required");
        } 

        return await ImageRepository.updateImageMetadata(userId, reflectionId, imageModel);
     } 

 
      public static async updateImage(buffer: Buffer, key: string, contentType?: string): Promise<ImageModel> {       
                const validMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];   

               if (contentType && !validMimeTypes.includes(contentType)) {
                   throw new Error("Unsupported file type");
               }  

                if(!key.includes('/')){ 
                   throw new Error("Invalid key format");
               }   
                
               const result =  await S3Service.upload( buffer, key, contentType);    
 
                if(result.key !== key){
                    throw new Error("Failed to update image: key mismatch");
               }        
 
   
               const imageId =  result.key.split('/').pop() || '';  
                
               const imageModel = new ImageModel(imageId, contentType || "");
               imageModel.encrypted = false;
               imageModel.updatedAt = new Date(); 
    
               const userId = key.split('/')[0] || ''; 
               const reflectionId =  key.split('/')[1] || '';   
            
               await ImageRepository.updateImageMetadata(userId, reflectionId, imageModel);

               return imageModel; 
      }  

       
      public static async uploadImage(
        buffer: Buffer,
        key: string,
        contentType?: string,
        isEncrypted?: boolean, 
        encryptedMetaData?: string,
        encryptedImageKey?: string,
        imageKeyNonce?: string,
        metadataNonce?: string
      ): Promise<ImageModel> {    

               const validMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/octet-stream"]; 

               if (contentType && !validMimeTypes.includes(contentType) && !isEncrypted) {
                   throw new Error(Errors.INVALID_FILE_TYPE);
               } 

               if(!key.includes('/')){ 
                   throw new Error(Errors.INVALID_KEY_FORMAT);
               } 

               const dateCreated =  new Date();  
        
               const result = await S3Service.upload( buffer, key, contentType);      

              const imageId =  result.key.split('/').pop() || '';     
               
               const imageModel = new ImageModel(imageId, isEncrypted ? "application/octet-stream" : (result.contentType || contentType || ""));        
 
               imageModel.url = result.url; 
               
               if (isEncrypted) {
                   imageModel.encrypted = true;
                   imageModel.encryptedImageKey = encryptedImageKey; 
                   imageModel.imageKeyNonce = imageKeyNonce;
                
               } else {
                   imageModel.encrypted = false;
                   imageModel.encryptedMetadata = encryptedMetaData ?? null;
                   imageModel.metadataNonce = null;
                   imageModel.encryptedImageKey = null;
                   imageModel.imageKeyNonce = null;
               }
                   
               imageModel.createdAt = dateCreated; 
  
               const userId = key.split('/')[0] || '';     
               const reflectionId = key.split('/')[1] || '';
        
               try{
                     await ImageRepository.saveImageMetadata(userId, reflectionId, imageModel);
               }
                catch(err){
                    // Rollback S3 upload if metadata save fails
                    await S3Service.deleteImage(key);
                    throw err;
               }  

               return imageModel;
      }       

      public static async deleteImage(key: string): Promise<void> {     
         
                if(!key.includes('/')){ 
                   throw new Error("Invalid key format");
               } 

               await S3Service.deleteImage(key); 
               const userId = key.split('/')[0] || '';
               const reflectionId = key.split('/')[1] || '';  
               const imageId =  key.split('/').pop() || '';     

               console.log(`Deleting image metadata for userId: ${userId}, reflectionId: ${reflectionId}, imageId: ${imageId}`);  

               return await ImageRepository.deleteImageMetadata(userId, reflectionId, imageId);
      }

      public static async getImage(key: string): Promise<ImageModel> {  

               if(!key.includes('/')){ 
                   throw new Error("Invalid key format");
               }  

                 
               const userId = key.split('/')[0] || '';  
               const reflectionId = key.split('/')[1] || ''; 
               const imageId = key.split('/')[2] || ''; 
                
               const image = await ImageRepository.getImageMetadata(userId, reflectionId, imageId);     
            
               if(!image){
                   throw new Error(Errors.IMAGE_NOT_FOUND);
               }  

               return image;      
                
      }        

      public static async getAllImages(filter: ImageFilter): Promise<ImageModel[]> { 

                return await ImageRepository.getAllImageMetadata(filter);
      }

      public static async createFolder(key: string): Promise<void> {     
         
                if(!key.includes('/')){ 
                        throw new Error("Invalid key format");
                } 
               await S3Service.createFolder(key); 
      }  

      public static async deleteFolder(key: string): Promise<void> {      
         
              if(!key.includes('/')){ 
                   throw new Error("Invalid key format");
               } 
               await S3Service.deleteFolder(key); 
      }

}