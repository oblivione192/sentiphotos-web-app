# Encryption Management Skill

**Purpose**: Help AI agents orchestrate end-to-end encryption/decryption workflows for images and reflections in the Image Gallery project.

**Triggers**: When user asks to:
- "Encrypt/decrypt images"
- "Add encryption support to [feature]"
- "Debug encryption failures"
- "Test encrypted data flow"
- "Manage encryption keys"

---

## Skill Overview

This codebase uses **AES-GCM end-to-end encryption**:
- Encryption happens **100% on the frontend** via Web Crypto API
- Backend stores encrypted blobs + metadata references (never decrypts)
- Agents need to understand the full flow to add/modify encryption features

### Key Architecture

```
User Password (input)
    ↓ PBKDF2 (310k iterations)
User KEK (Key Encryption Key)
    ↓ AES-GCM encrypt
Master Key (stored encrypted in DB)
    ↓ [For each reflection]
Reflection Key (AES-GCM)
    ↓ [For each image in reflection]
File Key (AES-GCM)
```

**All nonces**: 12-byte random values, transmitted as Base64

---

## Common Encryption Tasks

### 1. Encrypt an Image (Frontend)

**Location**: [frontend/src/Services/Encryption.ts](frontend/src/Services/Encryption.ts) → `encryptImage()`

**Usage**:
```typescript
const encrypted = await EncryptionService.encryptImage({
  reflectionKey: userReflectionKey, // CryptoKey
  fileData: blob // Blob | ArrayBuffer | Uint8Array
});

// Result structure:
// {
//   encryptedFile: Uint8Array,     // Encrypted file bytes
//   fileNonce: Uint8Array,         // 12-byte nonce
//   encryptedFileKey: Uint8Array,  // Encrypted file key
//   fileKeyNonce: Uint8Array       // Nonce for file key
// }
```

**Next Step**: Convert Uint8Array to Base64 before sending to backend:
```typescript
EncryptionService.toBase64(encrypted.encryptedFile)
```

### 2. Upload Encrypted Image (Frontend → Backend)

**Location**: [frontend/src/Objects/Api/ImageApi.ts](frontend/src/Objects/Api/ImageApi.ts) → `uploadImages()`

**FormData sent**:
```
POST /api/images/{reflectionId}
Content-Type: multipart/form-data

- images (Blob): encrypted file bytes
- encryptedFileKeys (string): Base64 of encryptedFileKey
- fileKeyNonces (string): Base64 of fileKeyNonce
- fileNonces (string): Base64 of fileNonce
- encrypted (string): "true"
```

**Backend handling** [src/Routes/Images.ts](backend-new/src/Routes/Images.ts):
- Stores encrypted blob in S3 with key: `{userId}/{reflectionId}/{imageId}`
- Stores metadata in Firestore:
  - `encryptedMetadata` (if provided)
  - `encryptedImageKey` (encrypted file key)
  - Nonces

### 3. Decrypt Encrypted Metadata (Frontend)

**Location**: [frontend/src/Services/Encryption.ts](frontend/src/Services/Encryption.ts) → `decryptCollection()`

**Usage**:
```typescript
const { reflectionKey, metadata } = await EncryptionService.decryptCollection(
  masterKey, // CryptoKey
  {
    encryptedReflectionKey: fromBase64(encrypted.encryptedReflectionKey),
    reflectionKeyNonce: fromBase64(encrypted.reflectionKeyNonce),
    encryptedMetadata: fromBase64(encrypted.encryptedMetadata),
    metadataNonce: fromBase64(encrypted.metadataNonce)
  }
);
```

### 4. Decrypt Encrypted Image (Frontend)

**Location**: [frontend/src/Services/Encryption.ts](frontend/src/Services/Encryption.ts) → `decryptImage()`

**Usage**:
```typescript
const decryptedImageBytes = await EncryptionService.decryptImage(
  reflectionKey, // CryptoKey
  {
    encryptedFileKey: fromBase64(imageModel.encryptedImageKey),
    fileKeyNonce: fromBase64(imageModel.imageKeyNonce),
    encryptedFile: new Uint8Array(await encryptedBlob.arrayBuffer()),
    fileNonce: fromBase64(imageModel.fileNonce)
  }
);

// Convert to Blob if needed
const decryptedBlob = new Blob([decryptedImageBytes], { type: 'image/jpeg' });
```

---

## Common Pitfalls & Debugging

### 1. Base64 Encoding Mismatch
❌ **Problem**: Sending Uint8Array directly to backend instead of Base64
- Frontend sends raw bytes → Backend misinterprets as metadata
- Solution: Always use `EncryptionService.toBase64()` before transmission

✅ **Fix**:
```typescript
const base64Key = EncryptionService.toBase64(encrypted.encryptedFileKey);
formData.append("encryptedFileKeys", base64Key);
```

### 2. Nonce Length Incorrect
❌ **Problem**: Using wrong nonce length (must be exactly 12 bytes)
- AES-GCM requires 12-byte IV per spec
- Backend checks this during integration tests

✅ **Fix**: Nonce generation is hardcoded at [top of Encryption.ts](frontend/src/Services/Encryption.ts#L28):
```typescript
const NONCE_LENGTH = 12;
const nonce = crypto.getRandomValues(new Uint8Array(NONCE_LENGTH));
```

### 3. Forgetting to Decode From Base64
❌ **Problem**: Passing Base64 string directly to decryption functions (expecting Uint8Array)
- Decryption expects raw bytes, not encoded strings
- Solution: Decode from Base64 first using `EncryptionService.fromBase64()`

### 4. Wrong Key for Decryption
❌ **Problem**: Using master key to decrypt file data (should use reflection key)
- Key hierarchy: Master Key → Reflection Key → File Key
- Each level has a specific purpose
- Solution: Use the correct key from the hierarchy

---

## Testing Encryption Features

### Unit Tests
**Location**: [frontend/tests/integration-test/EncryptionServiceTest.test.ts](frontend/tests/integration-test/EncryptionServiceTest.test.ts)

Run: `npm run test`

### Integration Tests
**Location**: [backend-new/__tests__/integration/s3.integration.test.ts](backend-new/__tests__/integration/s3.integration.test.ts)

Run: `npm run test:integration` (requires AWS credentials in `.env.development`)

### Manual Testing
1. **Create encrypted reflection**:
   - Frontend: Call `EncryptionService.encryptCollection()` with metadata
   - POST to `/api/reflection`
   - Verify Firestore stores encrypted metadata

2. **Upload encrypted image**:
   - Frontend: Call `EncryptionService.encryptImage()` with file
   - POST to `/api/images/{reflectionId}`
   - Verify S3 stores encrypted blob + Firestore stores metadata

3. **Download & decrypt**:
   - Frontend: GET from `/api/images/{reflectionId}/{imageId}`
   - Call `EncryptionService.decryptImage()` with metadata nonces
   - Verify decrypted bytes match original file

---

## Related Files & Patterns

### Frontend Encryption Flow
1. [Services/Encryption.ts](frontend/src/Services/Encryption.ts) — Core Web Crypto API
2. [Objects/Api/ImageApi.ts](frontend/src/Objects/Api/ImageApi.ts) — HTTP client with FormData
3. [Objects/Api/ReflectionApi.ts](frontend/src/Objects/Api/ReflectionApi.ts) — Reflection metadata API
4. [Stores/Profile.ts](frontend/src/Stores/Profile.ts) — Master key state (CryptoKey)

### Backend Storage Patterns
1. [Controllers/Uploads/ImageController.ts](backend-new/src/Controllers/Uploads/ImageController.ts) — Receive encrypted blob + metadata
2. [Services/S3Service.ts](backend-new/src/Services/S3Service.ts) — S3 upload/download
3. [Routes/Images.ts](backend-new/src/Routes/Images.ts) — API route handlers
4. [Repositories/ImageRepository.ts](backend-new/src/Repositories/ImageRepository.ts) — Firestore CRUD

---

## Workflow: Adding Encryption to a New Feature

1. **Add encryption logic** in [frontend/src/Services/Encryption.ts](frontend/src/Services/Encryption.ts)
   - Create new method if needed (e.g., `encryptDocument()`)
   - Use AES-GCM with 12-byte nonce
   - Test in isolation

2. **Add API endpoint** in backend [Routes/](backend-new/src/Routes/)
   - Accept FormData with encrypted blob + metadata
   - Store blob in S3, metadata in Firestore
   - Return ImageModel or ReflectionModel with metadata

3. **Add HTTP client** in [frontend/src/Objects/Api/](frontend/src/Objects/Api/)
   - Create function to call new endpoint
   - Handle FormData + Base64 encoding
   - Return structured response

4. **Test end-to-end**:
   - Frontend encrypts → Backend stores → Frontend decrypts
   - Run integration tests: `npm run test:integration`

5. **Document** in AGENTS.md and this skill file

---

## Environment & Setup

**Frontend**: No special setup (Web Crypto API is native)
**Backend**: Requires AWS credentials and Firebase service account
- See [backend-new/README.md](backend-new/README.md) for full setup

```bash
# Run backend dev server
cd backend-new && npm run dev

# Run frontend dev server
cd frontend && npm run dev
```

---

**Last Updated**: 2026-04-16  
**Skill Type**: Feature management (encryption/decryption)  
**Complexity**: High — requires understanding of cryptography, key hierarchies, and full stack
