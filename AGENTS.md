# Image Gallery Agent Instructions

This document helps AI coding agents understand the Image Gallery codebase and work effectively on encryption/decryption, image management, and API development.

## Project Overview

**Image Gallery Solo Project** is a full-stack React + Node.js application featuring **client-side encrypted photo storage**.

- **Frontend**: React 19 + TypeScript + Vite (`frontend/`)
- **Backend**: Express.js + TypeScript + Firebase Firestore + AWS S3 (`backend-new/`)
- **Architecture**: Trust-less (all encryption happens on client; backend is a dumb storage layer)

## Key Principles

### 1. Encryption is End-to-End
- **All encryption/decryption happens in the frontend** via Web Crypto API
- Backend stores encrypted blobs as-is, never decrypts
- Backend stores encryption metadata (nonces, encrypted keys) in Firestore
- See [frontend/src/Services/Encryption.ts](frontend/src/Services/Encryption.ts) for the full encryption logic

### 2. AES-GCM Standard
- Algorithm: **AES-GCM** with **12-byte random nonces**
- Key Hierarchy: Password → KEK (PBKDF2, 310k iterations) → Master Key → Reflection Keys → File Keys
- All sensitive data is Base64-encoded when transmitted/stored

### 3. Backend Storage Pattern
- **S3**: Stores encrypted file blobs as `application/octet-stream`
- **Firestore**: Stores metadata references (encrypted keys, nonces, etc.) as Base64 strings
- Key path format: `{userId}/{reflectionId}/{imageId}`
- **Large-file uploads**: Prefer backend-generated presigned multipart S3 URLs so the frontend can PUT encrypted chunks directly to S3.

## Critical Files

### Frontend
| File | Purpose |
|------|---------|
| [src/Services/Encryption.ts](frontend/src/Services/Encryption.ts) | Web Crypto API for encryption/decryption (master key, collections, files) |
| [src/Objects/Api/ImageApi.ts](frontend/src/Objects/Api/ImageApi.ts) | HTTP client for encrypted image upload/download |
| [src/Objects/Api/ReflectionApi.ts](frontend/src/Objects/Api/ReflectionApi.ts) | HTTP client for encrypted reflections (metadata collections) |
| [src/Stores/Profile.ts](frontend/src/Stores/Profile.ts) | Master key state management (CryptoKey storage) |

### Backend
| File | Purpose |
|------|---------|
| [src/Controllers/Uploads/ImageController.ts](backend-new/src/Controllers/Uploads/ImageController.ts) | Image upload/download logic; stores to S3 + Firestore metadata |
| [src/Services/S3Service.ts](backend-new/src/Services/S3Service.ts) | AWS S3 client wrapper (PutObject, GetObject, DeleteObject) |
| [src/Routes/Images.ts](backend-new/src/Routes/Images.ts) | Express route handlers for `/api/images/*` endpoints |
| [src/Repositories/ImageRepository.ts](backend-new/src/Repositories/ImageRepository.ts) | Firestore image metadata CRUD |
| [src/Models/ImageModel.ts](backend-new/src/Models/ImageModel.ts) | Image data model (fields: `encrypted`, `encryptedMetadata`, `encryptedImageKey`) |

## Common Tasks & Patterns

### Encrypting a File (Frontend)
```typescript
const result = await EncryptionService.encryptImage({
  reflectionKey: cryptoKey,
  fileData: file // Blob | ArrayBuffer | Uint8Array
});
// Returns: { encryptedFile, fileNonce, encryptedFileKey, fileKeyNonce, fileKey }
// Convert to Base64 when sending to backend
```

### Uploading Encrypted Image (Frontend → Backend)
1. Encrypt the file using `EncryptionService.encryptImage()`
2. POST to `/api/images/{reflectionId}` with multipart FormData:
   - `images`: encrypted blob
   - `encryptedFileKeys`: Base64-encoded encrypted file key
   - `fileKeyNonces`: Base64-encoded nonce
   - `fileNonces`: Base64-encoded file nonce
   - `encrypted`: "true"
3. Backend stores blob in S3, metadata in Firestore

### Retrieving Encrypted Metadata (Backend)
Backend returns ImageModel with fields:
- `encryptedMetadata`: Base64-encoded encrypted metadata
- `encryptedImageKey`: Base64-encoded encrypted file key
- `metadataNonce` / `fileKeyNonce` / `fileNonce`: Base64-encoded nonces

Frontend decodes all from Base64 before decryption.

### Presigned Multipart Uploads for Large Encrypted Files
For large uploads, the backend should generate S3 presigned multipart URLs instead of proxying encrypted blobs through the server. The frontend can:
1. request an upload ID from the backend
2. encrypt chunks locally with AES-GCM and prepend a 12-byte IV
3. PUT each chunk directly to S3 using the presigned URL
4. return the list of `{ PartNumber, ETag }` to the backend
5. call `CompleteMultipartUpload` on S3 from the backend

This preserves the zero-knowledge design while improving performance for files larger than 5MB.

## Environment Setup

See [backend-new/README.md](backend-new/README.md) for full setup instructions.

**Backend `.env.development` required**:
- `AWS_REGION`, `AWS_BUCKET_NAME`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- `FIRESTORE_SERVICE_ACCOUNT_PATH` pointing to Firebase service account JSON

## Build & Test Commands

**Backend** (`cd backend-new`):
```bash
npm run dev                    # Watch mode
npm run build                  # Compile TypeScript → JavaScript
npm test                       # Unit tests (vitest)
npm run test:integration       # S3 + Firestore integration tests
```

**Frontend** (`cd frontend`):
```bash
npm run dev                    # Vite dev server (http://localhost:5173)
npm run build                  # Production build
```

## API Routes Handling Encrypted Data

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/images/{reflectionId}` | POST | Upload encrypted image(s) |
| `/api/images/{reflectionId}/{imageId}` | GET | Retrieve encrypted image metadata |
| `/api/images/{reflectionId}/{imageId}` | DELETE | Delete encrypted image |
| `/api/reflection` | POST | Create encrypted reflection (metadata collection) |
| `/api/reflection` | PUT | Update encrypted reflection |

## Tips for AI Agents

1. **When modifying encryption logic**: Test both upload & download flows end-to-end
2. **When adding new endpoints**: Follow the pattern: Frontend encrypts → Backend stores metadata + S3 blob → Frontend retrieves & decrypts
3. **When debugging encryption failures**: Check for Base64 encoding/decoding mismatches (frontend ↔ backend)
4. **Test utilities exist**: Run `npm run test:integration` to verify S3 + Firestore functionality
5. **Keep backend stateless**: Never add decryption logic; treat backend as untrusted storage

## Development Agents

- **Encryption Management Agent**: Orchestrates encryption/decryption workflows for images and reflections
- **Major Refactor Agent**: Executes high-impact refactors driven by user requirements
- **See**: `/create-agent encryption-management` or `/create-agent major-refactor-agent` to invoke these specialized agents

---

**Last Updated**: 2026-04-16
