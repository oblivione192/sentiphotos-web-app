import ImageApi from '../../src/api/ImageApi';
import { ImageUploadPayloadModel } from '../../src/Models/ImageUploadPayloadModel';
import { ImageModel } from '../../src/Models/ImageModel'; 
import {expect, it, vitest} from 'vitest';
import { describe } from 'vitest'; 

describe('ImageApi Integration Tests', () => {
    it('should upload an image successfully', async () => {
        const mockFile = new File(['dummy content'], 'test-image.jpg', { type: 'image/jpeg' });
        const payload = new ImageUploadPayloadModel();
        payload.images = [mockFile];
        payload.reflectionId = 'test-reflection-id';
        const mockResponse: ImageModel = {
            id: 'test-image-id',
            url: 'http://example.com/test-image.jpg',
            reflectionId: 'test-reflection-id',
        };
        vitest.spyOn(ImageApi, 'uploadImage').mockResolvedValue(mockResponse);
        const result = await ImageApi.uploadImage(payload);
        expect(result).toEqual(mockResponse);
    });

    it('should delete an image successfully', async () => {
        const imageId = 'test-image-id';
        vitest.spyOn(ImageApi, 'deleteImage').mockResolvedValue();
        await expect(ImageApi.deleteImage(imageId)).resolves.toBeUndefined();
    }); 
    it('should fetch an image successfully', async () => {
        const imageId = 'test-image-id';
        const mockResponse: ImageModel = {
            id: imageId,
            url: 'http://example.com/test-image.jpg',
            reflectionId: 'test-reflection-id',
        };
        vitest.spyOn(ImageApi, 'getImage').mockResolvedValue(mockResponse);
        const result = await ImageApi.getImage(imageId);
        expect(result).toEqual(mockResponse);
    }
    );
});
