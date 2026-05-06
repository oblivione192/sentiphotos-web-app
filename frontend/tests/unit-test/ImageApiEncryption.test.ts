import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import ImageApi from "../../src/Objects/Api/ImageApi";
import { ImageUploadPayloadModel } from "../../src/Objects/Models/ImageUploadPayloadModel";
import EncryptionService from "../../src/Services/Encryption";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, { deep: true });

describe("ImageApi encryption integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uploads encrypted payload when reflection key is provided", async () => {
    const payload = new ImageUploadPayloadModel();
    payload.reflectionId = "reflection-1";
    payload.images = [new File(["hello"], "photo.jpg", { type: "image/jpeg" })];
    payload.reflectionKey = ({} as unknown) as CryptoKey;

    vi.spyOn(EncryptionService, "encryptImage").mockResolvedValue({
      encryptedFile: new Uint8Array([1, 2, 3]),
      fileNonce: new Uint8Array(12),
      encryptedFileKey: new Uint8Array([4, 5, 6]),
      fileKeyNonce: new Uint8Array(12),
      fileKey: ({} as unknown) as CryptoKey,
    });

    mockedAxios.post.mockResolvedValue({
      data: {
        uploads: [],
      },
    });

    await ImageApi.uploadImages(payload);

    expect(EncryptionService.encryptImage).toHaveBeenCalledTimes(1);
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);

    const postArgs = mockedAxios.post.mock.calls[0];
    expect(postArgs).toBeDefined();

    const formData = postArgs[1] as FormData;
    expect(formData.getAll("encrypted")).toEqual(["true"]);
    expect(formData.getAll("encryptedFileKeys")).toHaveLength(1);
    expect(formData.getAll("fileKeyNonces")).toHaveLength(1);
    expect(formData.getAll("fileNonces")).toHaveLength(1);
    expect(formData.getAll("sourceMimeTypes")).toEqual(["image/jpeg"]);
    expect(formData.getAll("images")).toHaveLength(1);
  });
});
