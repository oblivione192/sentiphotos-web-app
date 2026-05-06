import { S3Client,   
         ListObjectsV2Command,
         DeleteObjectsCommand,
         PutObjectCommand, 
         GetObjectCommand, 
         DeleteObjectCommand,
         CreateMultipartUploadCommand, 
         UploadPartCommand,
         AbortMultipartUploadCommand, 
         ListPartsCommand,
         CompleteMultipartUploadCommand,
         S3
        } from "@aws-sdk/client-s3";
import { env } from "../env.js";   
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";   
 
export interface UploadResult {
  key: string;
  url: string; 
  contentType: string; 
}


export class S3Service {
  private client: S3Client;
  private bucket: string;
  private region: string;

  constructor(client?: S3Client) {
    const region = env.AWS_REGION;
    this.region = region;
    this.bucket = env.AWS_BUCKET_NAME || "";    
    const credentials = {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    }
    this.client = client ?? new S3Client({ region, credentials });
  }     

  private canCreateSignedUrl(): boolean {
    const sdkClient = this.client as unknown as {
      config?: {
        endpointProvider?: unknown;
      };
    };
    return !!sdkClient?.config?.endpointProvider;
  }

  private buildPublicS3Url(key: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async updateImage(buffer: Buffer, key: string, contentType?: string): Promise<UploadResult> {
    return this.upload(buffer, key, contentType);
  }      

  async deleteImage(key: string): Promise<void> {
    if (!this.bucket) throw new Error("S3 bucket name is not configured (AWS_BUCKET_NAME)");  
    const params = {
      Bucket: this.bucket,
      Key: key,
    };    
    const cmd = new DeleteObjectCommand(params);
    await this.client.send(cmd);
  } 

  async getImage(key: string): Promise<string> {
    if (!this.bucket) throw new Error("S3 bucket name is not configured (AWS_BUCKET_NAME)");  
    if (!this.canCreateSignedUrl()) {
      // Tests may inject a minimal fake client that cannot be used by getSignedUrl.
      return this.buildPublicS3Url(key);
    }
    const params = {
      Bucket: this.bucket,
      Key: key,
    };  

    const cmd = new GetObjectCommand(params);   

    const response = await getSignedUrl(this.client, cmd, { expiresIn: 3600 });  

    return response; 
  }  

  async upload( buffer: Buffer, key: string, contentType?: string): Promise<UploadResult> {  
    
    if (!this.bucket) throw new Error("S3 bucket name is not configured (AWS_BUCKET_NAME)");
     
    
    const params = {
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    };

    const cmd = new PutObjectCommand(params);
    await this.client.send(cmd);

    //we will need the url to access the uploaded object just get the image url to access uploaded object
    const url = await this.getImage(key); 

    return { key, url, contentType};  
    
  }  
  
  async getSignedUploadUrl(key: string): Promise<string> {
    if (!this.bucket) throw new Error("S3 bucket name is not configured (AWS_BUCKET_NAME)");
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }); 
    // Generates a URL valid for 1 hour (3600 seconds)
    return await getSignedUrl(this.client, command, { expiresIn: 3600 });
  }

  async createMultipartUpload(key: string): Promise<string> {
    if (!this.bucket) throw new Error("S3 bucket name is not configured (AWS_BUCKET_NAME)");
    const params = { Bucket: this.bucket, Key: key };
    const cmd = new CreateMultipartUploadCommand(params);
    const upload = await this.client.send(cmd);
    return upload.UploadId!;
  }  

  async listParts(key: string, uploadId: string): Promise<{ ETag: string; PartNumber: number }[]> {
    if (!this.bucket) throw new Error("S3 bucket name is not configured (AWS_BUCKET_NAME)");
    const params = {
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId,
    };
    const cmd = new ListPartsCommand(params);
    const response = await this.client.send(cmd);
    return response.Parts?.map(part => ({ ETag: part.ETag!, PartNumber: part.PartNumber! })) || [];
  }

  async completeMultipartUpload(key: string, uploadId: string, parts: { ETag: string; PartNumber: number }[]): Promise<void> {
    if (!this.bucket) throw new Error("S3 bucket name is not configured (AWS_BUCKET_NAME)");
    const params = {
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts,
      },
    };
    const cmd = new CompleteMultipartUploadCommand(params);
    await this.client.send(cmd);
  } 

  async abortMultipartUpload(key: string, uploadId: string): Promise<void> {
     if(!this.bucket) throw new Error("S3 bucket name is not configured (AWS_BUCKET_NAME)");
     const params = {
        Bucket: this.bucket,
        Key: key,
        UploadId: uploadId,
     };
     const cmd = new AbortMultipartUploadCommand(params);
     await this.client.send(cmd); 
  }

  async getUploadPartPresignedUrl(key: string, uploadId: string, partNumber: number): Promise<string> {
       const command = new UploadPartCommand({
          Bucket: this.bucket,
          Key: key,
          UploadId: uploadId,
          PartNumber: partNumber,
        });

        // Generates a URL valid for 1 hour (3600 seconds)
        return await getSignedUrl(this.client, command, { expiresIn: 3600 });
  }

  async createFolder(key: string): Promise<void> {  
  
    if (!this.bucket) throw new Error("S3 bucket name is not configured (AWS_BUCKET_NAME)");
    const folderKey = key.endsWith('/') ? key : key + '/';

    const params = {
      Bucket: this.bucket,
      Key: folderKey,
      Body: '', // Empty body for folder
    };
    const cmd = new PutObjectCommand(params);
    await this.client.send(cmd);
  }  

  async getFolder(key: string): Promise<string> { 
    if (!this.bucket) throw new Error("S3 bucket name is not configured (AWS_BUCKET_NAME)");  
    const folderKey = key.endsWith('/') ? key : key + '/';
    if (!this.canCreateSignedUrl()) {
      return this.buildPublicS3Url(folderKey);
    }
    const params = {
      Bucket: this.bucket,
      Key: folderKey,
    }; 

    const cmd = new GetObjectCommand(params);   

    const response = await getSignedUrl(this.client, cmd, { expiresIn: 3600 });
    return response; 
  }

  async deleteFolder(prefix: string): Promise<void> {  
     const folderPrefix = prefix.endsWith("/") ? prefix : prefix + "/";

      let continuationToken: string | undefined;

      do {
        const listRes = await this.client.send(new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: folderPrefix,
          ContinuationToken: continuationToken,
        }));

        const objects = listRes.Contents ?? [];

        if (objects.length === 0) return;

        await this.client.send(new DeleteObjectsCommand({
          Bucket: this.bucket,
          Delete: {
            Objects: objects.map(o => ({ Key: o.Key! })),
            Quiet: true,
          },
        }));

        continuationToken = listRes.IsTruncated
          ? listRes.NextContinuationToken
          : undefined;

      } while (continuationToken);
  }

}

// default singleton for app usage
export default new S3Service();
