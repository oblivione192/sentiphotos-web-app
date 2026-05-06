# Encryption Workflows Reference

Quick recipes for common encryption tasks in the Image Gallery project.

---

## 1. User Registration with Master Key

**What**: User creates account, receives master key encrypted with password

**Frontend Steps**:
```typescript
// 1. Get password from user
const password = userInput.password;

// 2. Generate master key + recovery phrase
const result = await EncryptionService.registerAccount(password);
// Returns: { masterKey, recoveryPhrase, passwordSalt, masterKeyCiphertext, masterKeyNonce }

// 3. Save to backend (for future login)
const response = await fetch('/auth/users/register', {
  method: 'POST',
  body: JSON.stringify({
    username,
    password,
    email,
    passwordSalt: EncryptionService.toBase64(result.passwordSalt),
    masterKeyCiphertext: EncryptionService.toBase64(result.masterKeyCiphertext),
    masterKeyNonce: EncryptionService.toBase64(result.masterKeyNonce),
  })
});

// 4. Store master key in frontend state (never send to backend again)
// See: frontend/src/Stores/Profile.ts → setMasterKey()
```

**Related Code**:
- [EncryptionService.registerAccount()](frontend/src/Services/Encryption.ts)
- [User registration endpoint](backend-new/src/Routes/User.ts#L28-L40)

---

## 2. User Login with Password

**What**: User enters password, backend decrypts their master key

**Frontend Steps**:
```typescript
// 1. Get password from user
const password = userInput.password;

// 2. Fetch encrypted master key from backend
const user = await fetch(`/auth/users/profile`).then(r => r.json());
// Returns: { passwordSalt, masterKeyCiphertext, masterKeyNonce } (all Base64)

// 3. Decrypt master key with password
const masterKey = await EncryptionService.loginWithPassword({
  password,
  passwordSalt: EncryptionService.fromBase64(user.passwordSalt),
  masterKeyCiphertext: EncryptionService.fromBase64(user.masterKeyCiphertext),
  masterKeyNonce: EncryptionService.fromBase64(user.masterKeyNonce),
});

// 4. Store in state for session
setMasterKey(masterKey);
```

**Related Code**:
- [EncryptionService.loginWithPassword()](frontend/src/Services/Encryption.ts)
- [Login flow](frontend/src/Pages/Login.tsx)

---

## 3. Create Encrypted Reflection (Collection)

**What**: Create a metadata collection for images/reflections, encrypt it with master key

**Frontend Steps**:
```typescript
// 1. Prepare reflection metadata
const metadata = {
  title: "Summer Memories",
  description: "Photos from vacation",
  tags: ["travel", "family"]
};

// 2. Encrypt with master key
const encrypted = await EncryptionService.encryptCollection({
  masterKey: userMasterKey,
  metadata: metadata
});
// Returns: {
//   encryptedMetadata, metadataNonce, encryptedReflectionKey, reflectionKeyNonce, reflectionKey
// }

// 3. Send to backend
const response = await fetch('/api/reflection', {
  method: 'POST',
  body: JSON.stringify({
    title: "Summer Memories",
    description: "Photos from vacation",
    encrypted: true,
    encryptedMetadata: EncryptionService.toBase64(encrypted.encryptedMetadata),
    metadataNonce: EncryptionService.toBase64(encrypted.metadataNonce),
    encryptedReflectionKey: EncryptionService.toBase64(encrypted.encryptedReflectionKey),
    reflectionKeyNonce: EncryptionService.toBase64(encrypted.reflectionKeyNonce),
  })
});

// 4. Store reflection key in state for later image encryption
setReflectionKey(encrypted.reflectionKey);
```

**Backend**: Stores encrypted metadata in Firestore with model fields matching the payload above

**Related Code**:
- [ReflectionApi.createReflection()](frontend/src/Objects/Api/ReflectionApi.ts)
- [Reflection route](backend-new/src/Routes/Reflection.ts#L40-L55)
- [ReflectionModel](backend-new/src/Models/ReflectionModel.ts)

---

## 4. Encrypt & Upload Image via Presigned Multipart S3

**What**: Encrypt a large file chunk-by-chunk on the frontend, upload directly to S3 with presigned multipart URLs, then complete the multipart upload from the backend.

This flow avoids sending large raw encrypted blobs through the backend and reduces the latency introduced by multipart FormData.

### Phase 1: Handshake
1. FE asks BE to create a multipart upload.
2. BE calls `CreateMultipartUpload` on S3 and returns `{ uploadId, objectKey }`.
3. BE does not receive raw file bytes or encryption keys.

### Phase 2: Chunk Encrypt & Upload Loop
1. Slice the file to base chunk size, e.g. `5 * 1024 * 1024`.
2. For each chunk:
   - Generate a unique 12-byte IV.
   - Encrypt the chunk with AES-GCM.
   - Package into one blob: `[IV (12 bytes)] + [ciphertext (chunkSize + 16 bytes tag)]`.
3. FE requests a presigned URL for the current part from BE using `uploadId` and `partNumber`.
4. FE PUTs the packaged encrypted chunk directly to S3.
5. S3 returns an `ETag`; FE stores `{ PartNumber, ETag }`.

### Phase 3: Complete Multipart Upload
1. When all parts are uploaded, FE sends the list of all `{ PartNumber, ETag }` to BE.
2. BE calls `CompleteMultipartUpload` on S3 using the `uploadId` and part list.
3. S3 stitches the parts into one final object.

### Notes
- The final object size is original file size + overhead from 12-byte IVs and 16-byte tags per chunk.
- Keep the chunk size small enough to fit S3 multipart requirements and browser memory budgets.
- Backend stores only the resulting object key and metadata, not the file contents.

**Frontend Steps**:
```typescript
// 1. Start multipart upload
const createResponse = await fetch(`/api/images/${reflectionId}/multipart`, {
  method: 'POST',
  body: JSON.stringify({ filename: file.name, contentType: file.type })
});
const { uploadId, objectKey } = await createResponse.json();

// 2. Upload each chunk
const chunkSize = 5 * 1024 * 1024;
const eTagList: Array<{ PartNumber: number; ETag: string }> = [];
for (let partNumber = 1; offset < file.size; partNumber++) {
  const slice = file.slice(offset, offset + chunkSize);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await EncryptionService.encryptChunk({
    reflectionKey,
    data: slice,
    iv,
  });
  const packaged = new Blob([iv, encrypted.ciphertext]);

  const urlResponse = await fetch(`/api/images/${reflectionId}/multipart/${uploadId}/part/${partNumber}`);
  const { presignedUrl } = await urlResponse.json();

  const uploadResponse = await fetch(presignedUrl, {
    method: 'PUT',
    body: packaged,
    headers: {
      'Content-Type': 'application/octet-stream',
    },
  });
  eTagList.push({ PartNumber: partNumber, ETag: uploadResponse.headers.get('ETag')! });
  offset += chunkSize;
}

// 3. Complete upload
await fetch(`/api/images/${reflectionId}/multipart/${uploadId}/complete`, {
  method: 'POST',
  body: JSON.stringify({ objectKey, parts: eTagList }),
});
```

**Backend Role**:
- Create multipart upload and return `uploadId`
- Generate and return presigned URLs for part uploads
- Complete multipart upload with returned ETags
- Store object metadata and encrypted file metadata in Firestore

**Related Code**:
- Backend multipart upload controllers and S3 service should implement:
  - `createMultipartUpload`
  - `getPresignedPartUrl`
  - `completeMultipartUpload`

---

## 5. Download & Decrypt Chunked File

**What**: Fetch encrypted file ranges from S3, decrypt chunk-by-chunk in the browser, and assemble the final file without exhausting memory.

### Phase 1: Preparation
1. FE asks BE for a GET presigned URL and download metadata.
2. BE returns the S3 presigned GET URL and any metadata required to reconstruct chunks.
3. FE calculates the file ranges using the known chunk packaging format.

### Phase 2: Range Fetch
1. Each chunk is `chunkSize + 28 bytes` where 28 = 12-byte IV + 16-byte AES-GCM tag.
2. FE requests S3 with `Range: bytes=start-end` for each chunk.
3. S3 returns the encrypted chunk bytes.

### Phase 3: Extract & Decrypt
1. Read the first 12 bytes as IV.
2. Decrypt the remaining bytes with AES-GCM using the reflection key.
3. Append the decrypted bytes to a Blob or `FileSystemWritableFileStream`.

### Phase 4: Finalization
1. Repeat until all chunks are decrypted.
2. Combine decrypted chunks into the final file.
3. Present the file to the user.

**Frontend Steps**:
```typescript
const downloadResponse = await fetch(`/api/images/${reflectionId}/${imageId}/download`);
const { presignedUrl, chunkSize, totalSize } = await downloadResponse.json();

let offset = 0;
const decryptedChunks: BlobPart[] = [];
while (offset < totalSize) {
  const end = Math.min(offset + chunkSize + 27, totalSize - 1);
  const rangeResponse = await fetch(presignedUrl, {
    headers: {
      Range: `bytes=${offset}-${end}`,
    },
  });
  const encryptedChunk = new Uint8Array(await rangeResponse.arrayBuffer());
  const iv = encryptedChunk.slice(0, 12);
  const ciphertext = encryptedChunk.slice(12);
  const decrypted = await EncryptionService.decryptChunk({
    reflectionKey,
    iv,
    ciphertext,
  });
  decryptedChunks.push(new Blob([decrypted]));
  offset += chunkSize + 28;
}

const finalBlob = new Blob(decryptedChunks, { type: 'video/mp4' });
```

**Related Code**:
- `EncryptionService.decryptChunk()` or similar chunk decryption helper
- Backend download metadata route
- S3 presigned GET URL generation

---

## 6. Decrypt Encrypted Reflection Metadata

**What**: Retrieve reflection, decrypt its metadata with master key

**Frontend Steps**:
```typescript
// 1. Get master key from state
const masterKey = getCurrentMasterKey();

// 2. Fetch reflection from backend
const reflectionModel = await fetch(`/api/reflection/${reflectionId}`).then(r => r.json());
// Returns: ReflectionModel with encrypted metadata + encrypted reflection key

// 3. Decrypt collection metadata
const { reflectionKey, metadata } = await EncryptionService.decryptCollection(
  masterKey,
  {
    encryptedReflectionKey: EncryptionService.fromBase64(reflectionModel.encryptedReflectionKey),
    reflectionKeyNonce: EncryptionService.fromBase64(reflectionModel.reflectionKeyNonce),
    encryptedMetadata: EncryptionService.fromBase64(reflectionModel.encryptedMetadata),
    metadataNonce: EncryptionService.fromBase64(reflectionModel.metadataNonce)
  }
);

// 4. Use decrypted metadata and store reflection key for image operations
console.log(metadata); // { title, description, tags, ... }
setReflectionKey(reflectionKey);
```

**Related Code**:
- [EncryptionService.decryptCollection()](frontend/src/Services/Encryption.ts)
- [ReflectionApi.getReflection()](frontend/src/Objects/Api/ReflectionApi.ts)

---

## 7. Validate Recovery Phrase & Recover Master Key

**What**: User enters 24-word recovery phrase, derive master key without password

**Frontend Steps**:
```typescript
// 1. Get recovery phrase from user input
const words = userInput.recoveryPhrase.split(' ').map(w => w.trim());

// 2. Validate and convert to entropy
try {
  const entropy = await EncryptionService.phraseToEntropy(words);
  
  // 3. Derive master key from entropy
  const recoveredMasterKey = await EncryptionService.deriveMasterKeyFromEntropy(entropy);
  
  // 4. Store in state (user is now logged in)
  setMasterKey(recoveredMasterKey);
  
  console.log("Master key recovered successfully!");
} catch (error) {
  console.error("Invalid recovery phrase:", error.message);
}
```

**Related Code**:
- [EncryptionService.phraseToEntropy()](frontend/src/Services/Encryption.ts)
- [EncryptionService.deriveMasterKeyFromEntropy()](frontend/src/Services/Encryption.ts)

---

## 8. Common Error Debugging

### Error: "Decryption failed" or garbage output
**Likely cause**: Wrong key or wrong nonce

**Debug steps**:
1. Verify nonce length = 12 bytes: `nonce.length === 12`
2. Verify key is correct CryptoKey for this data (not master key for file key)
3. Verify nonce matches the one used during encryption
4. Add console logging:
   ```typescript
   console.log("Nonce length:", nonce.byteLength);
   console.log("Key algorithm:", key.algorithm);
   console.log("Encrypted data length:", encryptedData.byteLength);
   ```

### Error: "Base64 decode failed" or strange errors
**Likely cause**: Encoding/decoding mismatch

**Debug steps**:
1. Verify all .toBase64() calls are applied to Uint8Array, not strings
2. Verify all .fromBase64() calls on data before crypto operations
3. Log before/after:
   ```typescript
   console.log("Before Base64:", encrypted.encryptedFile);
   const encoded = EncryptionService.toBase64(encrypted.encryptedFile);
   console.log("After Base64:", encoded);
   const decoded = EncryptionService.fromBase64(encoded);
   console.log("After decode:", decoded);
   ```

### Error: FormData not received by backend
**Likely cause**: Missing form field or wrong field name

**Debug steps**:
1. Check exact field names match backend expectation:
   - `images` (Blob)
   - `encryptedFileKeys` (Base64 string)
   - `fileKeyNonces` (Base64 string)
   - `fileNonces` (Base64 string)
   - `encrypted` (string "true")
2. Use browser DevTools Network tab to inspect actual FormData sent
3. Verify S3 service account has PutObject permissions

---

## 9. Running Encryption Tests

### Unit Tests
```bash
cd frontend
npm test  # Runs EncryptionServiceTest.test.ts
```

### Integration Tests (Full Stack)
```bash
cd backend-new
npm run test:integration  # Tests S3 + Firestore with real encryption
```

**What gets tested**:
- Encryption/decryption round-trip
- FormData upload to backend
- S3 storage of encrypted files
- Firestore storage of metadata
- Nonce validation
- Base64 encoding/decoding

---

## 10. Performance Tips

1. **Cache master key** in state, don't re-derive on every operation
2. **Cache reflection keys** once decrypted (per reflection)
3. **Batch encrypt** multiple images instead of one-by-one
4. **Lazy load** images only when visible (intersection observer)
5. **Test with larger files** (10MB+) to catch memory issues

---

**Last Updated**: 2026-04-17
**Related Files**: AGENTS.md, .github/encryption-management-skill.md, .github/encryption-agent.md
