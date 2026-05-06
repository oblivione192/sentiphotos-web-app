import { UserRepository } from "../../Repositories/UserRepository.js";
import {compareSync, hashSync} from "bcrypt-ts";    
import UserModel from "../../Models/UserModel.js";  
import {Errors} from "../../Constants.js";  
import UserFilterModel from "../../Models/Filters/UserFilterModel.js"; 
import S3Service from "../../Services/S3Service.js";
import { v4 as uuidv4 } from "uuid";


export class UserLoginController {  

   public static async authenticateUser(username: string, password: string): Promise<UserModel> {
        const userFilter = new UserFilterModel();
        userFilter.username = username;
        const users = await UserRepository.indexUsers(userFilter);
        const user = users.length > 0 ? users[0] : null;
        if (!user) {
            throw new Error(Errors.USER_NOT_FOUND);
        }
        if (compareSync(password, user.passwordHash)) {
            return user; // Authentication successful
        } else {
            throw new Error(Errors.INVALID_PASSWORD);
        }
    }  


    public static async registerUser( 
        username: string,
        password: string, 
        email: string, 
        passwordSalt: string,
        masterKeyCipherText: string | null = null,
        masterKeyNonce: string | null = null
    ): Promise<void> {
        const userFilter = new UserFilterModel();
        userFilter.username = username;
        const users = await UserRepository.indexUsers(userFilter);
        if (users.length > 0) {
            throw new Error(Errors.USER_ALREADY_EXISTS);
        }
        const passwordHash = hashSync(password, 10);  
        const userId = `${uuidv4()}`;
        await UserRepository.addUser(
            userId, username, passwordHash, email, passwordSalt, masterKeyCipherText, masterKeyNonce
        );
    }  

    public static async deleteAccount(userId: string): Promise<void> {
        // Delete user's S3 folder and all contents
        const userFolderKey = `${userId}/`; 
   
        try {
            await S3Service.deleteFolder(userFolderKey);
        } catch (error) {
            console.error(`Error deleting S3 folder for user ${userId}:`, error);
        }

        // Delete user from database
        await UserRepository.deleteUser(userId);
    }

    public static async deleteAllUsers(): Promise<void> {
        const allUsers = await UserRepository.indexUsers();
        
        for (const user of allUsers) {
            try {
                await this.deleteAccount(user.id);
                console.log(`Deleted user: ${user.username} (${user.id})`);
            } catch (error) {
                console.error(`Error deleting user ${user.id}:`, error);
            }
        }
    }

}