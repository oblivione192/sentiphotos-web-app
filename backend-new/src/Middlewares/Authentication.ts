/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express"; 
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
    userId?: string
} 

export default function authenticateToken(req: AuthenticatedRequest, res: any, next: any): Response | void {  


    const token = req.cookies?.token;   
    if (!token) return res.status(401).json({ error: "No token provided" });

    try { 

        const decoded: any = jwt.verify(token, process.env.JWT);
        req.userId = decoded.userId;  

        next(); 

    } catch (err) {
        return res.status(401).json({ error: err.message || "Invalid token" });
    }
};


