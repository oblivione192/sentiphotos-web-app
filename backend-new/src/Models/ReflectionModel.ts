import { AuditableModel } from "./AuditableModel.js"; 

export class ReflectionModel extends AuditableModel{
    //this is an album of an image but it is renamed to reflection for the purpose of this project
    public id: string;
    public title: string;   
    public description: string;
    public encrypted: boolean;
    public encryptedMetadata?: string;
    public metadataNonce?: string;
    public encryptedReflectionKey?: string;
    public reflectionKeyNonce?: string;
    
    constructor(id: string, title: string, description: string){
        super();
        this.id = id;
        this.title = title; 
        this.description = description;
        this.encrypted = false;
    } 
    
    public toObject(): object{
        const base = {
            id: this.id,
            encrypted: this.encrypted,
            ...this.getAuditInfo()
        };

        if (this.encrypted) {
            return {
                ...base,
                encryptedMetadata: this.encryptedMetadata,
                metadataNonce: this.metadataNonce,
                encryptedReflectionKey: this.encryptedReflectionKey,
                reflectionKeyNonce: this.reflectionKeyNonce,
            };
        }

        return {
            ...base,
            title: this.title, 
            description: this.description, 
        };
    }
}