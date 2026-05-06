import S3Service from "../Services/S3Service.js";  
import { ReflectionRepository } from "../Repositories/ReflectionRepository.js";  
import { ReflectionModel } from "../Models/ReflectionModel.js";
import { ReflectionFilter } from "../Models/Filters/ReflectionFilter.js";
import { v4 as uuidv4 } from "uuid";
import { Errors } from "../Constants.js";
export class ReflectionController{ 
     
    public static async addReflectionForUser(userId: string, reflectionData: ReflectionModel): Promise<ReflectionModel> {  
       //we will be adding a subfolder under the user's folder named reflections
       //images will be stored under the reflections folder 
         reflectionData.id = reflectionData.id ? reflectionData.id : uuidv4();   
      

         await ReflectionRepository.saveReflectionMetadata(userId, reflectionData);   
         return reflectionData;   
    }

    public static async updateReflectionForUser(userId: string,  reflectionData: ReflectionModel): Promise<ReflectionModel> {  
        //we will be updating metadata only
        const updatedReflection = new ReflectionModel(reflectionData.id, reflectionData.title, reflectionData.description);  
        await ReflectionRepository.updateReflectionMetadata(userId, updatedReflection);   
        return updatedReflection;
   } 

    public static async deleteReflectionForUser(userId: string, reflectionId: string): Promise<void> {  
        //we will be deleting the entire reflection folder and its contents
        const key = `${userId}/${reflectionId}/`;  
        //DELETE THE FOLDER AND ALL ITS CONTENTS 
        await S3Service.deleteFolder(key);   
        await ReflectionRepository.deleteReflectionMetadata(userId, reflectionId); 
        
   }     


   public static async getReflectionMetadata(userId: string, reflectionId: string): Promise<ReflectionModel | null> { 
      const reflection = await ReflectionRepository.getReflectionMetadata(userId, reflectionId);
       if(!reflection) {
          throw new Error(Errors.REFLECTION_NOT_FOUND);
       } 

      return reflection;
   }     

   public static async getAllReflections(filter: Partial<ReflectionFilter>): Promise<ReflectionModel[]> {
      return await ReflectionRepository.getAllReflections(filter);
   }

}