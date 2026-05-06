import {vi, it, describe, expect, beforeAll} from 'vitest'; 

import axios from 'axios';  
import { afterAll } from 'vitest';
import {AxiosInstance} from 'axios'; 
import ReflectionApi from "../../src/Objects/Api/ReflectionApi"; 
import { ReflectionModel } from '../../src/Objects/Models/ReflectionModel'; 
import AuthenticationApi from '../../src/Objects/Api/AuthenticationApi'; 
import ImageApi from '../../src/Objects/Api/ImageApi'; 
import EncryptionService from '../../src/Services/Encryption';
import { ImageUploadPayloadModel } from '../../src/Objects/Models/ImageUploadPayloadModel';
import { UploadManager } from '../../src/Objects/Manager/UploadManager';

type LoginResponse = {
    token?: string;
    masterKey?: CryptoKey; 
}; 

describe('ImageApi - uploadImages full pipeline test', () => {
	let axiosClient: AxiosInstance;
	let masterKey: CryptoKey;
	let createdReflection: ReflectionModel; 
	let loginResult : LoginResponse;  
	let createdImageId: string; 

	let imageToBeUploaded: Blob;

	beforeAll(async () => {
		axiosClient = axios.create({
			baseURL: 'http://localhost:3005',
			withCredentials: true,
		});

		AuthenticationApi.init(axiosClient);

		loginResult = await AuthenticationApi.login(
			'testuser456',
			'TestPassword!123456'
		);

		axiosClient = axios.create({
			baseURL: 'http://localhost:3005',
			headers: {
				Cookie: `token=${loginResult.token}`,
			},
		});

		ReflectionApi.init(axiosClient);
		ImageApi.init(axiosClient); 

		masterKey = loginResult.masterKey!;

		const base64Png =
			"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

		const binary = atob(base64Png);
		const bytes = new Uint8Array(binary.length);

		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i);
		}

		imageToBeUploaded = new Blob([bytes], { type: 'image/png' });
	});

	afterAll(async () => {
		if (createdReflection?.reflectionId) {
			await ReflectionApi.deleteReflection(createdReflection.reflectionId);
		}
	});

	it('should upload and process large images (>5MB) with acceptable performance', async () => {
            // ----------------------------
            // 1. CREATE LARGE FILE (>5MB)
            // ----------------------------
            const SIZE_MB = 6;
            const sizeInBytes = SIZE_MB * 1024 * 1024;

            const largeBuffer = new Uint8Array(sizeInBytes);

            function fillRandom(buffer: Uint8Array) {
                const CHUNK_SIZE = 65536;

                for (let i = 0; i < buffer.length; i += CHUNK_SIZE) {
                    crypto.getRandomValues(buffer.subarray(i, i + CHUNK_SIZE));
                }
            }

            fillRandom(largeBuffer);

            const largeFile = new File([largeBuffer], 'large-test.jpg', {
                type: 'image/jpeg',
                lastModified: Date.now(),
            })

            expect(largeFile.size).toBeGreaterThan(5 * 1024 * 1024);

            // ----------------------------
            // 2. CREATE REFLECTION
            // ----------------------------
            const newReflection = new ReflectionModel();
            newReflection.title = 'Performance Test';
            newReflection.description = 'Large file upload test';

            createdReflection = await ReflectionApi.createReflection(
                newReflection,
                masterKey
            );

            expect(createdReflection.reflectionId).toBeDefined();

            // ----------------------------
            // 3. PREPARE PAYLOAD
            // ----------------------------
            const imagePayload = new ImageUploadPayloadModel();

            imagePayload.images.push(largeFile);
            imagePayload.imageMetadata = ['Large file metadata'];
            imagePayload.reflectionId = createdReflection.reflectionId;

            imagePayload.reflectionKey = await EncryptionService.decryptReflectionKey(
                masterKey,
                EncryptionService.fromBase64(createdReflection.encryptedReflectionKey!),
                EncryptionService.fromBase64(createdReflection.reflectionKeyNonce!)
            );

            // ----------------------------
            // 4. MEASURE UPLOAD TIME
            // ----------------------------
            const uploadStart = performance.now();

            const uploadedImage = await ImageApi.uploadImage(imagePayload);

            const uploadEnd = performance.now();
            const uploadDuration = uploadEnd - uploadStart;

            console.log(`Upload time (${SIZE_MB}MB): ${uploadDuration.toFixed(2)} ms`);

            expect(uploadedImage).toBeDefined();
            expect(uploadDuration).toBeLessThan(30000); // adjust threshold as needed

            createdImageId = uploadedImage.imageId!;

            // ----------------------------
            // 5. DOWNLOAD + DECRYPT PERFORMANCE
            // ----------------------------
            const imageFromBackend = await ImageApi.getImage(
                createdReflection.reflectionId!,
                createdImageId
            );

            const downloadStart = performance.now();

            const decryptedArrayBuffer = await ImageApi.decryptImage(
                imagePayload.reflectionKey!,
                imageFromBackend
            );

            const downloadEnd = performance.now();
            const downloadDuration = downloadEnd - downloadStart;

            console.log(`Download + decrypt time: ${downloadDuration.toFixed(2)} ms`);

            // ----------------------------
            // 6. VALIDATE INTEGRITY
            // ----------------------------
            const decryptedBytes = new Uint8Array(decryptedArrayBuffer);

            expect(decryptedBytes.byteLength).toBe(sizeInBytes);

            expect(downloadDuration).toBeLessThan(30000); // adjust based on infra
        }, 60000); 
        
        
        it('should handle multiple large file uploads (3 x 5MB+) without performance degradation', async () => {
            // ----------------------------
            // 1. CREATE LARGE FILES (3x 5MB+)
            // ----------------------------
            const SIZE_MB = 6;
            const sizeInBytes = SIZE_MB * 1024 * 1024;

            function createLargeFile(name: string): File {
                const buffer = new Uint8Array(sizeInBytes);

                // faster deterministic fill for performance tests
                buffer.fill(1);

                return new File([buffer], name, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                });
            }

            const files = [
                createLargeFile('large-1.jpg'),
                createLargeFile('large-2.jpg'),
                createLargeFile('large-3.jpg'),
            ];

            files.forEach(f => {
                expect(f.size).toBeGreaterThan(5 * 1024 * 1024);
            });

            // ----------------------------
            // 2. CREATE REFLECTION
            // ----------------------------
            const newReflection = new ReflectionModel();
            newReflection.title = 'Multi-file Performance Test';
            newReflection.description = 'Testing 3 concurrent large uploads';

            const reflection = await ReflectionApi.createReflection(
                newReflection,
                masterKey
            );

            expect(reflection.reflectionId).toBeDefined();

            // ----------------------------
            // 3. DECRYPT REFLECTION KEY
            // ----------------------------
            const reflectionKey = await EncryptionService.decryptReflectionKey(
                masterKey,
                EncryptionService.fromBase64(reflection.encryptedReflectionKey!),
                EncryptionService.fromBase64(reflection.reflectionKeyNonce!)
            );

            // ----------------------------
            // 4. BUILD PAYLOAD (3 FILES)
            // ----------------------------
            const imagePayload = new ImageUploadPayloadModel();

            imagePayload.images = files;
            imagePayload.imageMetadata = ['file-1', 'file-2', 'file-3'];
            imagePayload.reflectionId = reflection.reflectionId;
            imagePayload.reflectionKey = reflectionKey;

            // ----------------------------
            // 5. MEASURE MULTI-UPLOAD PERFORMANCE
            // ----------------------------
            const start = performance.now();

            const uploadedImages = await ImageApi.uploadImages(imagePayload);

            const end = performance.now();
            const duration = end - start;

            console.log(`3-file upload time (${SIZE_MB}MB each): ${duration.toFixed(2)} ms`);

            // ----------------------------
            // 6. VALIDATION
            // ----------------------------
            expect(uploadedImages).toBeDefined();
            expect(uploadedImages.length ?? 1).toBeGreaterThan(0);

            expect(duration).toBeLessThan(60000); // adjust threshold based on infra

            // ----------------------------
            // 7. OPTIONAL: VERIFY ALL FILES EXIST
            // ----------------------------
            for (const img of uploadedImages ?? [uploadedImages]) {

                const fetched = await ImageApi.getImage(
                    reflection.reflectionId!,
                    img.imageId!
                );

                expect(fetched.url).toBeDefined();
            }   

            // ----------------------------
            // 8. ENSURES DECRYPTION YIELDS SAME BLOB CONTENT AS ORIGINAL
            // ---------------------------- 
            
           for (let i = 0; i < imagePayload.images.length; i++) {
                const img = imagePayload.images[i];
                const uploadedImage = uploadedImages[i];

                expect(uploadedImage).toBeDefined();

                console.log(uploadedImage); 

                const decrypted = await ImageApi.decryptImage(reflectionKey, uploadedImage);

                const originalBlobContent = EncryptionService.toBase64(
                    new Uint8Array(decrypted)
                );

                const actualOriginalBlobContent = EncryptionService.toBase64(
                    new Uint8Array(await img.arrayBuffer())
                ); 

                console.log(originalBlobContent); 
                console.log(actualOriginalBlobContent); 

                expect(originalBlobContent).toEqual(actualOriginalBlobContent);
           }

    }, 90000);
		

});