import { FirestoreDBManagerSingleton } from "./DBManagers/FirestoreDBManagerSingleton.js";
import UserModel from "../Models/UserModel.js";
import {Constants, Errors} from "../Constants.js";    
import UserFilterModel from "../Models/Filters/UserFilterModel.js"; 

export class UserRepository { 

    public static getDBManager(): FirestoreDBManagerSingleton {
        return FirestoreDBManagerSingleton;
    }  
    private static getUsersCollectionPath(): string {
        // app
        return Constants.ROOT_COLLECTION;
    } 
    private static toSafeKey(userId: string): string {
        return userId.replace(/\//g, "_");
    }  

    public static async addUser(userId: string, username: string, passwordHash: string, email: string, passwordSalt: string, masterKeyCipherText: string | null = null, masterKeyNonce: string | null = null): Promise<void> {
        const path = this.getUsersCollectionPath();
        const safeKey = this.toSafeKey(userId);
        const userData = new UserModel(userId, username, passwordHash, email, passwordSalt, masterKeyCipherText, masterKeyNonce);
        return await FirestoreDBManagerSingleton.store(path, userData.toObject(), safeKey);
    }       

    public static async updateUser(userId: string, username?: string, passwordHash?: string, email?: string, passwordSalt?: string): Promise<void> {
        const path = this.getUsersCollectionPath();
        const safeKey = this.toSafeKey(userId);
        const existingUser = await FirestoreDBManagerSingleton.getOne<UserModel>(path, safeKey);    
        if (!existingUser) {
            throw new Error(Errors.USER_NOT_FOUND);
        }
        const updatedUser = new UserModel(
            userId,
            username || existingUser.username,
            passwordHash || existingUser.passwordHash,
            email || existingUser.email,
            existingUser.passwordSalt
        ); 

        return await FirestoreDBManagerSingleton.patch(path, safeKey, updatedUser.toObject());
    }
    
    public static async deleteUser(userId: string): Promise<void> {
        const path = this.getUsersCollectionPath();
        const safeKey = this.toSafeKey(userId);
        const user = await FirestoreDBManagerSingleton.getOne<UserModel>(path, safeKey);
        if (!user) {
            throw new Error(Errors.USER_NOT_FOUND);
        }
        return await FirestoreDBManagerSingleton.delete(path, safeKey);
    }
   
    public static async getUserById(userId: string): Promise<UserModel | null> {
        const path = this.getUsersCollectionPath();
        const safeKey = this.toSafeKey(userId);
        return await FirestoreDBManagerSingleton.getOne<UserModel>(path, safeKey);
    }  

    public static async indexUsers(userFilter?: UserFilterModel): Promise<UserModel[]> {
        const path = this.getUsersCollectionPath();
        return await FirestoreDBManagerSingleton.getAll<UserModel>(path, userFilter);
    }

}