export class AuditableModel{  

    public createdAt: Date; 

    public updatedAt: Date | null; 

    constructor(
        createdAt?: Date,
        updatedAt?: Date | null
    ){
        this.createdAt = createdAt || new Date(); 
        this.updatedAt = updatedAt || null; 
    }   

    public getAuditInfo(): { createdAt: Date; updatedAt: Date | null } {
        return {
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }  
}