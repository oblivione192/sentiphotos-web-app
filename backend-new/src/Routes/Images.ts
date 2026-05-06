import Router from "express"; 
import { Request, Response } from "express";  
import { AuthenticatedRequest } from "../Middlewares/Authentication.js";
import multer from "multer";
import { ImageController } from "../Controllers/Uploads/ImageController.js";  
import { ImageModel } from "../Models/ImageModel.js";   
import { ImageFilter } from "../Models/Filters/ImageFilter.js";  
import { Errors } from "../Constants.js";
import { v4 as uuidv4 } from "uuid";
import { MultiPartUploadController } from "../Controllers/MultiPartUploadController.js";


const Helpers = { 
  createFilterFromRequest: (req: Request): Partial<ImageFilter> => {
    const image: Partial<ImageFilter> =  new ImageFilter();

    if (req.query.userId && typeof req.query.userId === 'string') {
        image.userId = req.query.userId;
    }  
    if (req.query.reflectionId && typeof req.query.reflectionId === 'string') {
        image.reflectionId = req.query.reflectionId;
     }
    if(req.query.limit && typeof req.query.limit === 'string'){
        const limit = parseInt(req.query.limit, 10); 
        if (!isNaN(limit) && limit > 0) {
            image.limit = limit;
        }
    } 
    if(req.query.page && typeof req.query.page === 'string'){
        const page = parseInt(req.query.page, 10);
        if (!isNaN(page) && page > 0) {
            image.page = page;
        }
    } 

    return image; 
  }
}

const imageRouter = Router();      

imageRouter.get("/uploadUrl/:reflectionId", MultiPartUploadController.getUploadUrl);   
imageRouter.get("/multipartUploadParts/:reflectionId/:uploadId", MultiPartUploadController.getMultipartUploadParts);
imageRouter.post("/initiateMultipartUpload/:reflectionId", MultiPartUploadController.initiateUpload);
imageRouter.post("/getPresignedUrls", MultiPartUploadController.getPresignedUrls); 
imageRouter.post("/completeMultipartUpload", MultiPartUploadController.completeUpload);
imageRouter.post("/abortMultipartUpload", MultiPartUploadController.abortUpload);  

imageRouter.get("/presignedUrl/:reflectionId/:imageId",async(req: AuthenticatedRequest, res: Response)=>{
     const { reflectionId, imageId } = req.params; 
     const userId = req.userId; 
    
     try{ 
         const url = await ImageController.getSignedUrlForImage(userId,reflectionId as string, imageId as string);  
         return res.json(url); 
     }
     catch(error){ 
        return  res.status(500).send({message: error.message}); 
     }
})

imageRouter.get("/:reflectionId/:imageId", async (req: AuthenticatedRequest, res: Response) => { 

    const {  reflectionId, imageId } = req.params;  
    const userId = req.userId; //from middleware authentication 

    try {  
        const key = `${userId}/${reflectionId}/${imageId}`;
        const image: ImageModel = await ImageController.getImage(key as string);
        console.log(image); 
        return res.json(image);  
    } catch (err) {
        switch(err.message){
            case Errors.INVALID_KEY_FORMAT:
                return res.status(400).json({ error: Errors.INVALID_KEY_FORMAT });
            case Errors.IMAGE_NOT_FOUND:
                return res.status(404).json({ error: Errors.IMAGE_NOT_FOUND });
            default:
                console.error("Unexpected get image error:", err);
                return res.status(500).json({ error: "An unexpected error occurred while retrieving the image" });
        }
    } 
});   

imageRouter.get("/imageMeta", async (req: AuthenticatedRequest, res: Response) => {
    
    try {        
        
        const filter = Helpers.createFilterFromRequest(req);     
        filter.userId = req.userId; // Add userId from authenticated request

        if(filter.reflectionId == null && filter.userId == null ){
            return res.status(400).json({ error: "At least one filter parameter (userId, reflectionId) must be provided" });
        }
         
        if (filter.imageId && filter.reflectionId && filter.userId) {
            const image = await ImageController.getImage(`${filter.userId}/${filter.reflectionId}/${filter.imageId}`);
            return res.json(image);
        }  
          
        const images: ImageModel[] = await ImageController.getAllImages(filter);
        return res.json(images);    
         
    } catch (err) { 
        console.error("Get image metadata error:", err);
        return res.status(500).json({ error: "Failed to retrieve image metadata" });
    }
});

imageRouter.post("/:reflectionId/metadata", async (req: AuthenticatedRequest, res: Response) => {  

    
    const imageModels = [];  

    try{ 
    
     imageModels.push(...await Promise.all(ImageModel.createMultipleFromRequest(req)
                       .map(async(image)=>{
                           return await ImageController.addImageMetadata(
                             req.userId,
                             req.params.reflectionId as string, 
                             image
                           )
      }))); 
   
    
      return res.json({images: imageModels}); 

     }catch(err){
         console.error("Error adding image metadata:", err);
         return res.status(500).json({ error: "Failed to add image metadata" });
     }


});    
  

imageRouter.patch("/:reflectionId/:imageId", multer().single("image"), async (req: AuthenticatedRequest, res: Response) => {
    const file = req.file;  
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    } 
    try { 
      const userId = req.userId;
      const { reflectionId, imageId } = req.params;
      const key = `${userId}/${reflectionId}/${imageId}`;
      const result: ImageModel = await ImageController.uploadImage(file.buffer, key, file.mimetype);   
      return res.json(result); 
    }
    catch (err) {
      console.error("Upload error:", err);
      return res.status(500).json({ error: "Upload failed" });
    } 
  });    

imageRouter.delete("/:reflectionId/:imageId", async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    const { reflectionId, imageId} = req.params;
    try {    
        const path = `${userId}/${reflectionId}/${imageId}`
        await ImageController.deleteImage(path);
        return res.json({ message: "Image deleted successfully" });
    }
    catch (err) {
       switch(err.message){
            case Errors.INVALID_KEY_FORMAT:
                return res.status(400).json({ error: Errors.INVALID_KEY_FORMAT });
            case Errors.DELETE_FAILED:
                return res.status(500).json({ error: Errors.DELETE_FAILED });
            default:
                console.error("Unexpected delete error:", err);
                return res.status(500).json({ error: "An unexpected error occurred while deleting the image" });
       }
    } 
  }); 


export default imageRouter;