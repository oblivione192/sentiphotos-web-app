import { describe, it, expect } from 'vitest';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import S3Service from '../../src/Services/S3Service.js';
import { env } from '../../src/env.js';
import { ImageController } from '../../src/Controllers/Uploads/ImageController.js';
import { FirestoreDBManagerSingleton } from '../../src/Repositories/DBManagers/FirestoreDBManagerSingleton.js';
import { ReflectionModel } from '../../src/Models/ReflectionModel.js';
import { ReflectionController } from '../../src/Controllers/ReflectionController.js';

// Type definitions
interface TestData {
  name: string;
  timestamp: number;
}

interface S3Credentials {
  accessKeyId: string;
  secretAccessKey: string;
}

// Only run this when explicitly enabled to avoid accidental real AWS operations during CI or local runs
const RUN_INTEGRATION = process.env.RUN_AWS_S3_INTEGRATION === 'true';
const describeIf = RUN_INTEGRATION ? describe : describe.skip;

describeIf('Connecting to a firestore database', () => {
  it('connects successfully before running S3 integration tests', async () => {
    FirestoreDBManagerSingleton.connect();
    expect(FirestoreDBManagerSingleton.isConnected()).toBe(true);
  });
}); 

describeIf('Adding an item to Firestore ', () => {
  it('adds a test item successfully before running S3 integration tests', async () => {   
    const testData: TestData = { name: 's3-integration-test', timestamp: Date.now() };
    await FirestoreDBManagerSingleton.store('integrationTests', testData, 's3-integration-test-id');
    const retrievedData = await FirestoreDBManagerSingleton.getOne<TestData>('integrationTests', 's3-integration-test-id'); 
    console.log("RetrievedData:", retrievedData);
    expect(retrievedData).not.toBeNull();
    expect(retrievedData?.name).toBe('s3-integration-test');
  });
});  
 
describeIf('Updating the Firestore test item', () => {
  it('updates the test item successfully before running S3 integration tests', async () => {
    const updatedData: Partial<TestData> = { name: 's3-integration-test-updated' };
    await FirestoreDBManagerSingleton.patch('integrationTests', 's3-integration-test-id', updatedData);
    const retrievedData = await FirestoreDBManagerSingleton.getOne<TestData>('integrationTests', 's3-integration-test-id');
    expect(retrievedData).not.toBeNull();
    expect(retrievedData?.name).toBe('s3-integration-test-updated');
  });
}); 
 
describeIf('Cleaning up Firestore test item', () => {
  it('deletes the test item successfully after running S3 integration tests', async () => {   
    await FirestoreDBManagerSingleton.delete('integrationTests', 's3-integration-test-id');   
    const retrievedData = await FirestoreDBManagerSingleton.getOne<TestData>('integrationTests', 's3-integration-test-id');
    expect(retrievedData).toBeNull();
  });
});  


describeIf('AWS S3 integration for all operations', () => {
  it(
    'uploads, retrieves, and deletes an object in the configured bucket',
    async () => {
      const bucket = env.AWS_BUCKET_NAME;
      const region = env.AWS_REGION
      if (!bucket || !region) {
        throw new Error('Set AWS_BUCKET_NAME and AWS_REGION to run S3 integration tests');
      }
      const key = `user/123/test-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.txt`;
      const buffer = Buffer.from(`integration-test-${Date.now()}`);
      const svc = S3Service; 
      try {
        // Upload
        const uploadRes = await svc.upload(buffer, key, 'text/plain');
        expect(uploadRes.key).toBe(key);
        expect(uploadRes.url).toContain(bucket);
        // Retrieve
        const url = await svc.getImage(key);
        expect(url).toBeDefined();
        expect(typeof url).toBe('string');  
        expect(url).toContain(key);
        expect(url).toContain(bucket);
      } finally {
        // Cleanup: delete the object
        await svc.deleteImage(key);     

        // Verify deletion  
        const credentials: S3Credentials = {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        }     
        
        const client = new S3Client({ region, credentials });
        await expect(
          client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
        ).rejects.toThrow();
      }
    },
    30000,
  );
}); 

describeIf('Integration with S3 and Firestore to store images according to reflections', () => { 
   
    it('stores image metadata in Firestore and image in S3, then retrieves both successfully', async () => { 
       const userId = "integration-test-user"; 
       let reflectionId = ''; 
        
       const imageBuffer = Buffer.from('fake-image-data');
       try{ 
              // Create reflection to associate with image
              const reflection = await ReflectionController.addReflectionForUser(userId, new ReflectionModel(null, "Test Reflection for Image", "Testing image upload with reflection"));
              reflectionId = reflection.id;
              // Upload image through controller which should save metadata in Firestore  
              const imageKey = `${userId}/${reflectionId}/test-image-${Date.now()}.jpg`; 
              const uploadedImage = await ImageController.uploadImage(imageBuffer, imageKey, 'image/jpeg');
              expect(uploadedImage).toBeDefined();
              expect(uploadedImage.imageId).toBe(imageKey.split('/').pop());
              expect(uploadedImage.mimeType).toBe('image/jpeg');
              // Retrieve image metadata from Firestore
              const retrievedMetadata = await ImageController.getImage(imageKey);
              expect(retrievedMetadata).toBeDefined();
              expect(retrievedMetadata?.imageId).toBe(uploadedImage.imageId);
              expect(retrievedMetadata?.mimeType).toBe(uploadedImage.mimeType);
              // Retrieve image metadata
              const retrievedImage = await ImageController.getImage(imageKey);
              expect(retrievedImage.mimeType).toBe(uploadedImage.mimeType);  
              expect(retrievedImage.imageId).toBe(uploadedImage.imageId);

        } finally {
              // Cleanup: delete image and metadata  
               const imageKey = `${userId}/${reflectionId}/test-image-${Date.now()}.jpg`;
              await ImageController.deleteImage(imageKey);  
          

              await ReflectionController.deleteReflectionForUser(userId, reflectionId);
              const deletedReflection = await ReflectionController.getReflectionMetadata(userId, reflectionId);
              expect(deletedReflection).toBeNull(); 
       }
    })  

  }, 30000);

describeIf("Integration with firestore and S3 for integration metadata", () => {
    it("stores and retrieves image metadata in Firestore", async () => {
       //should only add folder to aws s3 and store metadata in firestore
       const userId = "integration-test-user";
       let reflectionId = '';
        
        try {
             const newlyAddedReflection = await ReflectionController.addReflectionForUser(userId,
               new ReflectionModel(null, "Test Title", "Test Description")
              );  

            reflectionId = newlyAddedReflection.id;  

             const metadata = await ReflectionController.getReflectionMetadata(userId, reflectionId);
             expect(metadata).not.toBeNull();
             expect(metadata?.id).toBe(reflectionId);
             expect(metadata?.title).toBe("Test Title");
             expect(metadata?.description).toBe("Test Description");
        }
        finally {
            // Cleanup: delete folder and metadata
            await ReflectionController.deleteReflectionForUser(userId, reflectionId);
            const deletedMetadata = await ReflectionController.getReflectionMetadata(userId, reflectionId);
            expect(deletedMetadata).toBeNull();

        }
    }, 30000);
});
