import { Router } from "express"; 
import { Request, Response } from "express";    
import { AuthenticatedRequest } from "../Middlewares/Authentication.js";
import { ReflectionFilter } from "../Models/Filters/ReflectionFilter.js"; 
import { ReflectionController } from "../Controllers/ReflectionController.js"; 
import { ReflectionModel } from "../Models/ReflectionModel.js";
import { Errors } from "../Constants.js";

const Helpers = { 
  createFilterFromRequest: (req: Request): Partial<ReflectionFilter> => {  
    const filter: Partial<ReflectionFilter> = new ReflectionFilter();

    if (req.query.userId && typeof req.query.userId === 'string') {
      filter.userId = req.query.userId;
    }
   
     if(req.query.limit && typeof req.query.limit === 'string'){
          const limit = parseInt(req.query.limit, 10);
          if (!isNaN(limit) && limit > 0) {
               filter.limit = limit;
          }
     } 

     if(req.query.page && typeof req.query.page === 'string'){
          const page = parseInt(req.query.page, 10);
          if (!isNaN(page) && page > 0) {
               filter.page = page;
          }
     }
   
    return Object.assign(new ReflectionFilter(), filter);
  }
} 

const reflectionRouter = Router(); 

reflectionRouter.post('/',async(req: AuthenticatedRequest, res:Response)=>{
     
     const userId = req.userId;
     const { 
          title, 
          description, 
          encrypted, 
          encryptedMetadata, 
          metadataNonce, 
          encryptedReflectionKey, 
          reflectionKeyNonce 
     } = req.body;  

     try{
      const model = new ReflectionModel(null, title, description);
      if (encrypted === true || encrypted === "true") {
          model.encrypted = true;
          model.encryptedMetadata = encryptedMetadata;
          model.metadataNonce = metadataNonce;
          model.encryptedReflectionKey = encryptedReflectionKey;
          model.reflectionKeyNonce = reflectionKeyNonce;
      }
      const result = await ReflectionController.addReflectionForUser(userId as string, model); 
      console.log("Result for adding reflection: ", result); 
      return res.json(result);
     }  

     catch(err){
          switch(err.message){
               case Errors.REFLECTION_CREATION_FAILED:
                    return res.status(400).json({error: Errors.REFLECTION_CREATION_FAILED});
               default:
                    console.error("Unexpected error creating reflection:", err);
          }
           return res.status(500).json({error: err.message})
     }
}) 

reflectionRouter.patch('/:reflectionId',async(req: AuthenticatedRequest, res: Response)=>{   
      
     const { title, description, encrypted, encryptedMetadata, metadataNonce, encryptedReflectionKey, reflectionKeyNonce } = req.body;   
     const { reflectionId } = req.params;   
     const userId = req.userId;

     try{  
           
           const model = new ReflectionModel(reflectionId as string, title, description);
           if (encrypted === true || encrypted === "true") {
               model.encrypted = true;
               model.encryptedMetadata = encryptedMetadata;
               model.metadataNonce = metadataNonce;
               model.encryptedReflectionKey = encryptedReflectionKey;
               model.reflectionKeyNonce = reflectionKeyNonce;
           }
           const result = await ReflectionController.updateReflectionForUser(userId as string, model);

           return res.json(result);  

     } 
     catch(err){
          switch(err.message){
               case Errors.REFLECTION_UPDATE_FAILED:
                    return res.status(400).json({error: Errors.REFLECTION_UPDATE_FAILED});
               case Errors.REFLECTION_NOT_FOUND:
                    return res.status(404).json({error: Errors.REFLECTION_NOT_FOUND});
               default:
                    console.error("Unexpected error updating reflection:", err);
          }
            return res.status(500).send(err.message); 
     }
})  

reflectionRouter.delete('/:reflectionId', async(req: AuthenticatedRequest, res: Response)=>{ 
      const { reflectionId } = req.params; 
      const userId = req.userId;
      
      try{
           await ReflectionController.deleteReflectionForUser(userId as string, reflectionId as string); 
           return res.json({message: "Reflection successfully deleted"}); 
      }  
      catch(err){ 
          switch(err.message){
               case Errors.REFLECTION_NOT_FOUND:
                    return res.status(404).json({error: Errors.REFLECTION_NOT_FOUND});
               case Errors.REFLECTION_DELETE_FAILED:
                    return res.status(500).json({error: Errors.REFLECTION_DELETE_FAILED});
               default:
                    console.error("Unexpected error deleting reflection:", err);
          }
          return res.status(500).send("Failed to delete reflection"); 
      }
})

reflectionRouter.get("/reflections", async(req: AuthenticatedRequest, res: Response)=>{
      try{
           const filter = Helpers.createFilterFromRequest(req);  
           
           console.log(filter); 

           const reflections = await ReflectionController.getAllReflections(filter);  
           
           return res.json(reflections);    

      }  
      catch(err){ 
           return res.status(500).json({error: err.message}); 
      }
}) 

reflectionRouter.get("/:reflectionId", async(req: AuthenticatedRequest, res: Response)=>{
     const  { reflectionId } = req.params;   
     const userId = req.userId;
      
     try{ 
          const result = await ReflectionController.getReflectionMetadata(userId as string, reflectionId as string);   
          console.log(result); 
          return res.json(result); 
     } 
     catch(err){
               switch(err.message){
                    case Errors.REFLECTION_NOT_FOUND:
                         return res.status(404).json({error: Errors.REFLECTION_NOT_FOUND});
                    default:
                         console.error("Unexpected error fetching reflection metadata:", err);
               }
           return res.status(500).json({error: err.message}); 
     }
})

export default reflectionRouter; 