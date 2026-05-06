export class ReflectionFilterModel{
    public userId: string | null = null;
    public reflectionId: string | null = null
    public title: string | null = null;
    public content: string | null = null; 
    public page: number = 1;
    public limit: number = 10; 

    public toObject(): object {
        return {
            userId: this.userId,
            reflectionId: this.reflectionId,
            title: this.title,
            content: this.content,
            page: this.page,
            limit: this.limit
        };
    }   
}