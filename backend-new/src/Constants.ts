export const Constants = {
     ROOT_COLLECTION: "app", 
     PORT: 3005, 
} 

export const Errors = {
     INVALID_FILE_TYPE: "Unsupported file type",
     INVALID_KEY_FORMAT: "Invalid key format",  
     IMAGE_NOT_FOUND: "Image not found",
     UPLOAD_FAILED: "Upload failed", 
     DELETE_FAILED: "Failed to delete image", 
     REFLECTION_NOT_FOUND: "Reflection not found",
     DUPLICATE_REFLECTION: "Reflection with the same id already exists",
     REFLECTION_CREATION_FAILED: "Failed to create reflection",
     REFLECTION_UPDATE_FAILED: "Failed to update reflection",
     REFLECTION_DELETE_FAILED: "Failed to delete reflection", 
     USER_ID_REQUIRED: "userId is required",
     USER_NOT_FOUND: "User not found",   
     USER_ALREADY_EXISTS: "User already exists", 
     USER_CREATION_FAILED: "Failed to create user",
     USER_AUTHENTICATION_FAILED: "Failed to authenticate user",  
     INVALID_PASSWORD: "Invalid password",
     ACCESS_UNAUTHORIZED: "Unauthorized access",
} 

export default {
     Constants,
     Errors,
}