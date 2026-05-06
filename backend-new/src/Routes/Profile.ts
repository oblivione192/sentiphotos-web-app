import { Router } from "express"; 
import { Response } from "express";      
import { AuthenticatedRequest } from "../Middlewares/Authentication.js";    
import ProfileController from "../Controllers/ProfileController.js";
import { Errors } from "../Constants.js"; 

const profileRouter = Router();

profileRouter.get('/', async(req: AuthenticatedRequest, res: Response)=>{
    const userId = req.userId as string;

    try{
        const userProfile = await ProfileController.getUserProfile(userId);
        return res.json(userProfile);
    }
    catch(err){
        switch(err.message){
            case Errors.USER_NOT_FOUND:
                return res.status(404).json({error: err.message || "User not found"});
            default:
                console.error("Unexpected error fetching user profile:", err);
                return res.status(500).json({error: "An unexpected error occurred while fetching the user profile"});
        }
    }
})

profileRouter.patch('/', async(req: AuthenticatedRequest, res: Response)=>{
    const userId = req.userId as string;
    const { username, email } = req.body;   
    try{
        await ProfileController.updateUserProfile(userId, username, email);
        return res.json({message: "User profile updated successfully"});
    }
    catch(err){
        switch(err.message){
            case Errors.USER_NOT_FOUND:
                return res.status(404).json({error: err.message || "User not found"});
            default:
                console.error("Unexpected error updating user profile:", err);
                return res.status(500).json({error: "An unexpected error occurred while updating the user profile"});
        }
    }
}  )

export default profileRouter;