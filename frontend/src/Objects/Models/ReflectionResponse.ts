type ReflectionResponseModel = {
	id?: string | null;
	title?: string | null;
	description?: string | null; 
	encryptedMetadata?: string | null;  
	encrypted: boolean; 
	metadataNonce?: string | null; 
	encryptedReflectionKey?: string | null; 
	reflectionKeyNonce?: string | null; 
	createdAt?: string | null;
	updatedAt?: string | null;
};

type ReflectionQueryModel = {
	userId?: string;
	id?: string;
	title?: string;
	description?: string;
	page?: number;
	limit?: number;
}; 

export type {ReflectionResponseModel, ReflectionQueryModel};