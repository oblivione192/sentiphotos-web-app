export class ImageFilterModel{ 
    public userId: string | null = null;
    public imageId: string | null = null;
    public reflectionId: string | null = null;  
    public page: number = 1;
    public limit: number = 10; 

    public toObject(): object {
        return {
            userId: this.userId,
            imageId: this.imageId,
            reflectionId: this.reflectionId,
            page: this.page,
            limit: this.limit
        };
    }
}