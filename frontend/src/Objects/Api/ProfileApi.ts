import EncryptionService from "../../Services/Encryption";
import { UserModel } from "../Models/UserModel"; 
import axios from "axios"; 
type ProfileResponseModel = {
    id?: string | null;
    username?: string | null;
    email?: string | null; 
    passwordSalt: string | null;  
    masterKeyCipherText: string | null; 
    masterKeyNonce: string | null; 
    createdAt?: string | null;
};

export default class ProfileApi{
    private static url = '/api/profile'; 
    private static toUserModel(profileData: ProfileResponseModel): UserModel {
        const user = new UserModel();
        user.userId = profileData.id ?? null;
        user.username = profileData.username ?? null;
        user.email = profileData.email ?? null;
        user.createdAt = profileData.createdAt ? 
                        new Date(profileData.createdAt) : null;

        return user;
    } 

    public static async getProfile(): Promise<UserModel> {
        try {
            const response = await axios.get(this.url);
            return this.toUserModel(response.data);
        } catch (error) {
            console.error('Error fetching profile:', error);
            throw new Error('Failed to fetch profile');
        }
    }
}