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

			expect(await ImageApi.getImage(
				createdReflection.reflectionId, 
				createdImageId
			)).toThrow(); 
 
		}

		
	});

	it('should validate input, encrypt, upload, and store metadata correctly', async () => {
		// ----------------------------
		// 1. CREATE REFLECTION
		// ---------------------------- 

		const newReflection = new ReflectionModel(); 

		newReflection.title = 'Test title'; 
		newReflection.description = 'Test Description'; 
		
		createdReflection = await ReflectionApi.createReflection(
			newReflection,
			masterKey
		);

		expect(createdReflection.reflectionId).toBeDefined();

		// ----------------------------
		// 2. PREPARE PAYLOAD
		// ----------------------------
		const imagePayload = new ImageUploadPayloadModel();

		imagePayload.images.push(
			new File([imageToBeUploaded], 'testname.jpg', {
				type: 'image/png',
				lastModified: Date.now(),
			})
		);

		imagePayload.imageMetadata = ['Sample Metadata'];
		imagePayload.reflectionId = createdReflection.reflectionId;

		imagePayload.reflectionKey = await EncryptionService.decryptReflectionKey(
			masterKey,
			EncryptionService.fromBase64(createdReflection.encryptedReflectionKey!),
			EncryptionService.fromBase64(createdReflection.reflectionKeyNonce!)
		);

		

		// ----------------------------
		// 4. CALL METHOD
		// ----------------------------
		const uploadedImage = await ImageApi.uploadImage(imagePayload);
        createdImageId = uploadedImage.imageId!; 
		// ----------------------------
		// 5. VALIDATE VALIDATION + FLOW
		// ----------------------------

		// ✔ result mapping
		expect(uploadedImage).toBeDefined();

	

	
	}, 30000);   
  
	it('should be able to retrieve the image and decrypt it to restore its original contents', async () => {
			const imageFromBackend = await ImageApi.getImage(
				createdReflection.reflectionId!,
				createdImageId,
			);

			expect(imageFromBackend).toBeDefined();
			expect(imageFromBackend.url).not.toBeNull();

			const response = await axios.get(imageFromBackend.url!, {
				responseType: "arraybuffer",
			});

			const encryptedFileBuffer = new Uint8Array(response.data);

			const reflectionKey = await EncryptionService.decryptReflectionKey(
				masterKey,
				EncryptionService.fromBase64(createdReflection.encryptedReflectionKey!),
				EncryptionService.fromBase64(createdReflection.reflectionKeyNonce!)
			);

			const decryptedBlob = await EncryptionService.decryptImage(reflectionKey, {
				encryptedFileKey: EncryptionService.fromBase64(imageFromBackend.encryptedImageKey!),
				fileKeyNonce: EncryptionService.fromBase64(imageFromBackend.imageKeyNonce!),
				encryptedFile: encryptedFileBuffer,
				fileNonce: EncryptionService.fromBase64(imageFromBackend.blobNonce!),
			});

			expect(
				EncryptionService.toBase64(decryptedBlob)
			).toEqual(
				"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
			);

			const decryptedBlobFromImageApiMethod = await ImageApi.decryptImage(
				reflectionKey, 
				imageFromBackend
			);    

			expect(
				EncryptionService.toBase64(new Uint8Array(decryptedBlobFromImageApiMethod))
			).toEqual(
				"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
			);

		});
		

});