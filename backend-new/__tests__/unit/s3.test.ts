import { vi, describe, it, expect, beforeEach } from "vitest";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";  
import { mockClient } from "aws-sdk-client-mock";
import { S3Service } from "../../src/Services/S3Service.js";  
import { Readable } from "stream";
import { sdkStreamMixin } from "@aws-sdk/util-stream-node";  
import { env } from "../../src/env.js";
import { ImageModel } from "../../src/Models/ImageModel.js";
import { Buffer } from "buffer";

describe("S3Service - upload", () => {
  it("uploads and returns url/key", async () => {
    const sendMock = vi.fn().mockResolvedValue({});

    const fakeClient = {
      send: sendMock,
    } as unknown as S3Client;

    process.env.AWS_BUCKET_NAME = "gallery-images-web-app";
    process.env.AWS_REGION = "ap-southeast-1";

    const svc = new S3Service(fakeClient);
    const buffer = Buffer.from("hello world");

    const res = await svc.upload(buffer, "file.txt", "text/plain");
 
    expect(res.key).toBe("file.txt");
    expect(res.url).toBe(
      "https://gallery-images-web-app.s3.ap-southeast-1.amazonaws.com/file.txt"
    );   
    expect(new ImageModel(res.key, "text/plain")).toBeDefined();
    expect(new ImageModel("file.txt", "text/plain")).toBeDefined();

    expect(sendMock).toHaveBeenCalled();

    const calledWith = sendMock.mock.calls[0][0];
    expect(calledWith).toBeInstanceOf(PutObjectCommand);
  });
});  

describe("S3Service - getImage", () => { 

  const s3Mock = mockClient(S3Client);
  
  beforeEach(() => {
      s3Mock.reset();
  });  

  it("retrieves image url", async () => {
    process.env.AWS_BUCKET_NAME = "gallery-images-web-app";

    s3Mock.on(GetObjectCommand).resolves({
      Body: sdkStreamMixin(Readable.from(["image data"])),
    });


    const svc  = new S3Service(new S3Client({ region: "ap-southeast-1" }));

    const url = await svc.getImage("test-image.jpg");

    expect(url).toBeDefined();
    expect(typeof url).toBe("string");    
    expect(url).toContain("https://gallery-images-web-app.s3.ap-southeast-1.amazonaws.com/test-image.jpg");
  });
});

describe("S3Service - getImage no data", () => {
  it("throws error when no data found", async () => {
    process.env.AWS_BUCKET_NAME = "gallery-images-web-app";
    const s3Mock = mockClient(S3Client);

    s3Mock.on(GetObjectCommand).resolves({}); 
    const svc = new S3Service(new S3Client({ region: "ap-southeast-1" }));

    await expect(svc.getImage("non-existent-image.jpg")).resolves.toBeDefined(); 
  })
});   


describe("S3Service - updateImage", () => {
  it("calls upload method", async () => {
    const uploadMock = vi.fn().mockResolvedValue({ key: "file.txt", url: "http://example.com/file.txt" });  
    const fakeClient = {
      send: vi.fn(),
    } as unknown as S3Client; 
    process.env.AWS_BUCKET_NAME = "gallery-images-web-app";   
    const svc = new S3Service(fakeClient);
    svc.upload = uploadMock;  
    const buffer = Buffer.from("updated content");
    const res = await svc.updateImage(buffer, "file.txt", "text/plain");
    expect(res.key).toBe("file.txt");
    expect(res.url).toBe("http://example.com/file.txt");  
    expect(new ImageModel(res.key, "text/plain")).toBeDefined();
    expect(new ImageModel("file.txt", "text/plain")).toBeDefined();
    expect(uploadMock).toHaveBeenCalledWith(buffer, "file.txt", "text/plain");
  });
});

describe("S3Service - deleteImage", () => {
  it("sends DeleteObjectCommand", async () => {
    const sendMock = vi.fn().mockResolvedValue({});
    const fakeClient = {
      send: sendMock,
    } as unknown as S3Client;
    process.env.AWS_BUCKET_NAME = "gallery-images-web-app";

    const svc = new S3Service(fakeClient);
    await svc.deleteImage("file-to-delete.txt");
    expect(sendMock).toHaveBeenCalled();
    const calledWith = sendMock.mock.calls[0][0];
    expect(calledWith.constructor.name).toBe("DeleteObjectCommand");
  }); 
}); 



describe("S3Service - missing bucket", () => {
  it("throws error when bucket name is missing", async () => {
    const fakeClient = {
      send: vi.fn(),
    } as unknown as S3Client; 
     
    delete env.AWS_BUCKET_NAME; 
    const svc = new S3Service(fakeClient);
    const buffer = Buffer.from("hello world");
    await expect(
      svc.upload(buffer, "file.txt", "text/plain")
    ).rejects.toThrow("S3 bucket name is not configured (AWS_BUCKET_NAME)");
  });   
});  
 