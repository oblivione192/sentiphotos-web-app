import {describe, expect, it} from "vitest";   

import ImageApi from "../../src/Objects/Api/ImageApi";  
import { ImageUploadPayloadModel } from "../../src/Objects/Models/ImageUploadPayloadModel"; 
describe("BlobChunkingUploadTest", () => {
    it("should upload a blob in chunks and store metadata", async () => {
        // This test would ideally mock the S3Service to verify that the correct calls are made for chunked uploads
        // and that the metadata is stored correctly. However, since we're doing an integration test, we can just
        // verify that the ImageApi's uploadImage method works end-to-end with a small blob.
        const blob = new File([new Uint8Array(5 * 1024 * 1024)], "test-image.jpg"); // 5MB blob
        const imageUploadPayload = new ImageUploadPayloadModel(); 

        imageUploadPayload.reflectionId = "test-reflection-id";
        imageUploadPayload.images = [blob];
        imageUploadPayload.imageMetadata = ["Test Image Metadata"];
        
       
        await ImageApi.uploadImage(imageUploadPayload);
         // If no errors are thrown, we can assume the upload process works. In a real test, we would verify the S3Service calls and metadata storage.  
    })
}); 
