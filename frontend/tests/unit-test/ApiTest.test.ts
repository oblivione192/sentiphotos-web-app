import axios from 'axios';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import ImageApi from '../../src/Objects/Api/ImageApi';

vi.mock('axios');

const mockedAxios = vi.mocked(axios, { deep: true });

describe('ImageApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should upload an image successfully', async () => {
    const mockFile = new File(['dummy content'], 'test-image.jpg', { type: 'image/jpeg' });
    const mockResponse = { id: '123', url: 'http://example.com/test-image.jpg' };

    mockedAxios.post.mockResolvedValue({ data: mockResponse });

    const result = await ImageApi.uploadImage(mockFile);

    expect(result).toEqual(mockResponse);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      '/api/images/upload',
      expect.any(FormData),
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
  });

  it('should delete an image successfully', async () => {
    const mockImageUrl = 'http://example.com/test-image.jpg';

    mockedAxios.delete.mockResolvedValue({});

    await expect(ImageApi.deleteImage(mockImageUrl)).resolves.toBeUndefined();
    expect(mockedAxios.delete).toHaveBeenCalledWith('/api/images/delete', {
      data: { imageUrl: mockImageUrl },
    });
  });

  it('should fetch an image successfully', async () => {
    const mockImageUrl = 'http://example.com/test-image.jpg';
    const mockResponse = { id: '123', url: mockImageUrl };

    mockedAxios.get.mockResolvedValue({ data: mockResponse });

    const result = await ImageApi.getImage(mockImageUrl);

    expect(result).toEqual(mockResponse);
    expect(mockedAxios.get).toHaveBeenCalledWith(mockImageUrl);
  });
});