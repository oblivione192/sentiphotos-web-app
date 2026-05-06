import { Router } from "express"; 
import { Request, Response } from "express";     
import { UserLoginController } from "../Controllers/Auth/UserLoginController.js";  
import { AuthenticatedRequest } from "../Middlewares/Authentication.js";
import { Errors } from "../Constants.js";
import jwt from "jsonwebtoken";
const userRouter = Router();

userRouter.post('/login', async(req: Request, res: Response)=>{
        const { username, password } = req.body;  
        try{
             const user = await UserLoginController.authenticateUser(username, password);   
             //store the jwt token into the cookie 
             const token = jwt.sign({ userId: user.id }, process.env.JWT, { expiresIn: '1h' });
             res.cookie('token', token, { 
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', 
                expires: new Date(Date.now() + 3600000) // 1 hour
             });
             
             return res.json({
                message: "Authentication successful", 
                token,
                masterKeyCipherText: user.masterKeyCipherText,
                masterKeyNonce: user.masterKeyNonce,
                passwordSalt: user.passwordSalt
             
            });
        }
        catch(err){ 
        
             return res.status(401).json({error: err.message || "Invalid credentials"});
        }
})

userRouter.post('/register', async(req: Request, res: Response)=>{
        
        const { 
                username, 
                password, 
                email,  
                passwordSalt, 
                masterKeyCipherText, 
                masterKeyNonce 
        } = req.body;    

        console.log(req.body)
 
        try{
                
          await UserLoginController.registerUser(
                username, 
                password, 
                email,  
                passwordSalt, 
                masterKeyCipherText, 
                masterKeyNonce
           );   

           return res.json({message: "User successfully registered"});
        }
        catch(err){  
            switch(err.message){ 
               
                case Errors.USER_ALREADY_EXISTS:
                    return res.status(409).json({error: err.message || "User already exists"});
                default: 
                    return res.status(400).json({error: err.message || "Nice try but I don't think you can register with those credentials"}); 
            }
        }
})

userRouter.post('/logout', (_req: Request, res: Response) => {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        });

        return res.json({ message: "Logged out successfully" });
})

userRouter.delete('/account', async(req: AuthenticatedRequest, res: Response) => {
        const userId = req.userId; 
        console.log(userId); 
        
        try {
                await UserLoginController.deleteAccount(userId as string);
                
                res.clearCookie('token', {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                });

                return res.json({ message: "Account successfully deleted" });
        } catch(err) {
                switch(err.message) {
                    case Errors.USER_NOT_FOUND:
                        return res.status(404).json({error: err.message});
                    default:
                        console.error("Error deleting account:", err);
                        return res.status(500).json({error: "Failed to delete account"});
                }
        }
})

//need some serious protection on this route in production, but for testing purposes we can leave it open for now
//DO NOT COMMIT THIS TO PRODUCTION VERY DANGEROUS BECAUSE IT DELETES ALL USERS IN THE DATABASE, SHOULD ONLY BE USED FOR TESTING PURPOSES

userRouter.delete('/all', async(_req: Request, res: Response) => {
        try {
                await UserLoginController.deleteAllUsers();
                return res.json({ message: "All accounts have been deleted" });
        } catch(err) {
                console.error("Error deleting all accounts:", err);
                return res.status(500).json({error: "Failed to delete accounts"});
        }
})

export default userRouter;