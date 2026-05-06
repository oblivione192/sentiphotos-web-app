import BaseFilterModel  from "./BaseFilterModel.js";  

export class ImageFilter extends BaseFilterModel{ 
       
    public userId?: string; 
    public imageId?: string;
    public reflectionId?: string; 

    constructor(){
        super();  
    }
  
}