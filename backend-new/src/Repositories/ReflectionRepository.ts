import { FirestoreDBManagerSingleton } from "./DBManagers/FirestoreDBManagerSingleton.js";
import { ReflectionModel } from "../Models/ReflectionModel.js";
import { ReflectionFilter } from "../Models/Filters/ReflectionFilter.js";
import {Constants, Errors} from "../Constants.js";

export class ReflectionRepository {

    private static COLLECTION_NAME = "reflections";

    private static getReflectionCollectionPath(user_id: string): string {
        return `${Constants.ROOT_COLLECTION}/${user_id}/${ReflectionRepository.COLLECTION_NAME}`;
    }

    public static getDBManager(): FirestoreDBManagerSingleton {
        return FirestoreDBManagerSingleton;
    }

    public static async saveReflectionMetadata(
        user_id: string,
        reflection: ReflectionModel
    ): Promise<void> {

        const path = this.getReflectionCollectionPath(user_id);

        // Check duplicate
        if (await FirestoreDBManagerSingleton.getOne<ReflectionModel>(path, reflection.id)) {
            throw new Error(Errors.DUPLICATE_REFLECTION);
        }

        return await FirestoreDBManagerSingleton.store(
            path,
            reflection.toObject(),
            reflection.id
        );
    }

    public static async updateReflectionMetadata(
        user_id: string,
        reflection: ReflectionModel
    ): Promise<void> {

        const path = this.getReflectionCollectionPath(user_id);
        const reflectionUuid = reflection.id; 

        const existingReflection = await FirestoreDBManagerSingleton.getOne<ReflectionModel>(path, reflectionUuid);

        if (reflectionUuid &&
            existingReflection) {
    
            reflection.updatedAt = new Date() 
            reflection.createdAt = existingReflection.createdAt;


            return await FirestoreDBManagerSingleton.patch(
                path,
                reflectionUuid,
                reflection.toObject()
            );
        } else {
            throw new Error(Errors.REFLECTION_NOT_FOUND);
        }
    }

    public static async deleteReflectionMetadata(
        user_id: string,
        reflectionId: string
    ): Promise<void> {

        const path = this.getReflectionCollectionPath(user_id);

        const reflection = await FirestoreDBManagerSingleton.getOne<ReflectionModel>(path, reflectionId);
        if (!reflection) {
            throw new Error(Errors.REFLECTION_NOT_FOUND);
        }

        return await FirestoreDBManagerSingleton.deleteRecursively(
            path,
            reflectionId
        );
    }

    public static async getAllReflections(
        reflectionFilter: Partial<ReflectionFilter>
    ): Promise<ReflectionModel[]> {

        if (!reflectionFilter.userId) {
            throw new Error(Errors.USER_ID_REQUIRED);
        }

        const path = this.getReflectionCollectionPath(reflectionFilter.userId); 
        console.log(path); 

        reflectionFilter.userId = undefined; 
        //exclude user id from filter since it's already part of the path 
        
        const reflections = await FirestoreDBManagerSingleton.getAll<ReflectionModel>(
            path,
            reflectionFilter
        ); 
      
        return reflections;
    }

    public static async getReflectionMetadata(
        user_id: string,
        reflectionId: string
    ): Promise<ReflectionModel | null> {

        const path = this.getReflectionCollectionPath(user_id);
    
        console.log(path, reflectionId);
        const data: ReflectionModel | null =
            await FirestoreDBManagerSingleton.getOne<ReflectionModel>(
                path,
                reflectionId
            );

        return data ? data : null; 
    }
}