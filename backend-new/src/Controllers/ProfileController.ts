import { UserRepository} from "../Repositories/UserRepository.js"; 
import UserModel  from "../Models/UserModel.js";

export default class ProfileController {

    public static async getUserProfile(userId: string): Promise<UserModel> {
        const user = await UserRepository.getUserById(userId);
        //need to exclude passwordHash from the returned user object for security reasons
        user.passwordHash = undefined as unknown as string; 
        if (!user) {
            throw new Error("User not found");
        }
        return user;
    } 

    public static async updateUserProfile(userId: string, username: string, email: string): Promise<void> {
        const user = await UserRepository.getUserById(userId);
        if (!user) {
            throw new Error("User not found");
        }
        user.username = username;
        user.email = email;
        await UserRepository.updateUser(user.id, user.username, user.passwordHash, user.email);
    }

}
