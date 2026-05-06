import type { AxiosInstance } from "axios";
import pLimit from "p-limit";

interface BinaryUploadPayload {
  bytes: Uint8Array;
  size: number;
  contentType: string;
}

type UploadInput = Blob | File | ArrayBuffer | Uint8Array | Buffer;

export class UploadManager {
  private axios: AxiosInstance;
  private fileList: Blob[];
  private limit = pLimit(3);

  constructor(axios: AxiosInstance, fileList: Blob[]) {
    this.axios = axios;
    this.fileList = fileList;
  }

  // -----------------------------
  // Environment detection
  // -----------------------------
  private isNode() {
    return typeof window === "undefined";
  }

  // -----------------------------
  // Canonical normalization
  // -----------------------------
  public async toBinaryPayload(
    input: UploadInput,
    contentType = "application/octet-stream"
  ): Promise<BinaryUploadPayload> {
    let bytes: Uint8Array;

    if (input instanceof Uint8Array) {
      bytes = input;
    } else if (typeof Buffer !== "undefined" && Buffer.isBuffer(input)) {
      bytes = new Uint8Array(input);
    } else if (input instanceof ArrayBuffer) {
      bytes = new Uint8Array(input);
    } else if (input instanceof Blob || input instanceof File) {
      bytes = new Uint8Array(await input.arrayBuffer());
    } else {
      throw new Error("Unsupported input type");
    }

    return {
      bytes,
      size: bytes.byteLength,
      contentType,
    };
  }

  // -----------------------------
  // Core upload (S3-safe)
  // -----------------------------
  private async uploadToS3(url: string, payload: BinaryUploadPayload) {
    const body = this.isNode()
      ? Buffer.from(payload.bytes)
      : payload.bytes;

    const headers: Record<string, string> = {
      "Content-Type": payload.contentType,
    };

    // Critical for Node stability
    if (this.isNode()) {
      headers["Content-Length"] = payload.size.toString();
    }

    const res = await fetch(url, {
      method: "PUT",
      headers,
      body: body as any,
    });

    if (!res.ok) {
      throw new Error(`S3 upload failed: ${res.status}`);
    }

    return res;
  }

  // -----------------------------
  // Strategy
  // -----------------------------
  private determineChunkSplittingStrategy(
    fileSize: number
  ): "single" | "multipart" {
    const MULTIPART_THRESHOLD = 10 * 1024 * 1024;
    return fileSize > MULTIPART_THRESHOLD ? "multipart" : "single";
  }

  // -----------------------------
  // Public API
  // -----------------------------
  public async uploadAllFiles(
    reflectionId: string,
    contentType?: string,
    partSize: number = 10 * 1024 * 1024
  ): Promise<string[]> {
    const results = await Promise.all(
      this.fileList.map((file) =>
        this.limit(() =>
          this.uploadSingleFile(file, reflectionId, contentType, partSize)
        )
      )
    );

    return results.flat();
  }

  private async uploadSingleFile(
    file: Blob,
    reflectionId: string,
    contentType?: string,
    partSize: number = 10 * 1024 * 1024
  ): Promise<string[]> {
    const strategy = this.determineChunkSplittingStrategy(file.size);

    if (strategy === "single") {
      return this.uploadSingle(file, reflectionId, contentType);
    }

    return this.uploadMultipart(file, reflectionId, contentType, partSize);
  }

  // -----------------------------
  // SINGLE UPLOAD (FIXED)
  // -----------------------------
  private async uploadSingle(
    file: UploadInput,
    reflectionId: string,
    contentType?: string
  ): Promise<string[]> {
    const { data } = await this.axios.get(
      `/api/images/uploadUrl/${reflectionId}`
    );

    const { key, url } = data;

    const payload = await this.toBinaryPayload(file, contentType);

    await this.uploadToS3(url, payload);

    const fileId = key.split("/").at(-1);
    return fileId ? [fileId] : [];
  }

  // -----------------------------
  // MULTIPART UPLOAD (FIXED)
  // -----------------------------
  private async uploadMultipart(
    file: Blob,
    reflectionId: string,
    contentType?: string,
    partSize: number = 10 * 1024 * 1024
  ): Promise<string[]> {
    const { data } = await this.axios.post(
      `/api/images/initiateMultipartUpload/${reflectionId}`
    );

    const { uploadId, key } = data;

    const fileBytes = new Uint8Array(await file.arrayBuffer());
    const totalParts = Math.ceil(fileBytes.length / partSize);

    const parts: { ETag: string; PartNumber: number }[] = [];

    await Promise.all(
      Array.from({ length: totalParts }, async (_, i) => {
        const partNumber = i + 1;

        const start = i * partSize;
        const end = Math.min(start + partSize, fileBytes.length);

        const partBytes = fileBytes.slice(start, end);

        const presignedRes = await this.axios.post(
          "/api/images/getPresignedUrls",
          {
            key,
            uploadId,
            partNumbers: [partNumber],
          }
        );

        const url = presignedRes.data.urls[0];

        const payload: BinaryUploadPayload = {
          bytes: partBytes,
          size: partBytes.byteLength,
          contentType: contentType || "application/octet-stream",
        };

        const res = await this.uploadToS3(url, payload);

        const etag = res.headers.get("etag") || "";

        parts.push({
          ETag: etag.replace(/"/g, ""),
          PartNumber: partNumber,
        });
      })
    );

    await this.axios.post("/api/images/completeMultipartUpload", {
      key,
      uploadId,
      parts: parts.sort((a, b) => a.PartNumber - b.PartNumber),
    });

    const fileId = key.split("/").at(-1);
    return fileId ? [fileId] : [];
  }
}