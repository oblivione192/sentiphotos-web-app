import express from "express";     
import imageRouter from "./Routes/Images.js"; 
import reflectionRouter from "./Routes/Reflection.js"; 
import userRouter from "./Routes/User.js";
import profileRouter from "./Routes/Profile.js";
import authenticateToken from "./Middlewares/Authentication.js";   
import cookieParser from "cookie-parser";
// Load environment variables from .env in development

const app = express();
const PORT = 3005;  

app.use(express.json());
app.use(cookieParser());

app.use("/api/images", authenticateToken, imageRouter);       
app.use("/api/reflection", authenticateToken, reflectionRouter);  
app.use("/api/profile", authenticateToken, profileRouter);
app.use("/auth/users", userRouter); 


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

 