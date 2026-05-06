# Encryption Management Agent

**Agent Name**: `modernize-encryption-manager`

**Purpose**: Specialized agent to orchestrate encryption/decryption workflows, debug encryption failures, and manage secure key operations in the Image Gallery project.

---

## When to Use This Agent

Invoke this agent when you need to:

### 1. Implement Encryption Features
- Add end-to-end encryption to a new feature
- Encrypt/decrypt collections or files
- Manage master keys and reflection keys
- Handle encryption metadata (nonces, encrypted keys)

### 2. Debug Encryption Issues
- Files decrypt to garbage or won't decrypt
- Base64 encoding/decoding mismatches
- Nonce length or format errors
- Key hierarchy or key derivation failures
- S3 → Firestore metadata sync problems

### 3. Enhance Encryption Security
- Implement new key derivation strategies
- Add encryption to API responses
- Validate encrypted data integrity
- Test encryption under various scenarios

### 4. Test & Validate
- Create encrypted test fixtures
- Run end-to-end encryption tests
- Verify upload/download encryption flows
- Validate encryption compliance

---

## Agent Capabilities

The encryption management agent is trained to:

✅ **Frontend Encryption**
- Web Crypto API (AES-GCM)
- Key derivation (PBKDF2)
- Nonce generation and validation
- Base64 encoding/decoding for transmission

✅ **Backend Encryption Metadata Handling**
- Receive encrypted blobs from frontend
- Store metadata in Firestore (Base64-encoded nonces & keys)
- Upload encrypted files to S3
- Manage encryption flags on models

✅ **Full-Stack Debugging**
- Trace encryption from frontend → backend → storage
- Identify encoding/decoding mismatches
- Validate key hierarchies
- Check integration test failures

✅ **Security Best Practices**
- Enforce AES-GCM with 12-byte nonces
- Validate key derivation iterations (310k PBKDF2)
- Ensure backend never decrypts (trust-less architecture)
- Verify recovery phrase validation

---

## Agent Invocation

### Example 1: Add Encryption to a New Feature
```
/create-agent encryption-management

Request: "Add client-side encryption to the new Documents feature. 
Documents should be encrypted with the user's master key, similar to images. 
Include upload endpoint, download endpoint, and end-to-end tests."
```

**Expected Output**:
- New `encryptDocument()` method in [frontend/src/Services/Encryption.ts](frontend/src/Services/Encryption.ts)
- New POST `/api/documents` endpoint in backend
- DocumentApi client in frontend
- Integration tests validating the full flow

### Example 2: Debug Decryption Failure
```
/create-agent encryption-management

Request: "I'm getting decryption errors when downloading images. 
The encryption seems to work on upload, but the frontend can't decrypt. 
Debug the image download flow from S3 retrieval through decryption."
```

**Expected Output**:
- Diagnostics of encryption metadata retrieval
- Base64 decoding validation
- Nonce length/format checks
- Suggested fixes with code changes

### Example 3: Implement Recovery Phrase Feature
```
/create-agent encryption-management

Request: "Implement recovery phrase validation. 
When a user enters their 24-word recovery phrase, 
validate it and derive their master key to unlock their vault."
```

**Expected Output**:
- Recovery phrase input component
- `phraseToEntropy()` call with validation
- Master key derivation from recovery phrase
- Integration with login flow

---

## Agent Workflow

The encryption management agent typically follows this pattern:

1. **Analyze** the requested encryption change
   - Understand current key hierarchy
   - Identify affected frontend + backend components
   - Check existing encryption patterns

2. **Plan** the implementation
   - Specify which services to modify (Encryption.ts, ImageApi.ts, etc.)
   - Outline Base64 encoding/decoding points
   - Define API contract (what FormData fields to send)
   - Plan test strategy

3. **Implement** in order:
   - Frontend encryption logic
   - API client (HTTP handler)
   - Backend route handler
   - Storage (S3 + Firestore)
   - Decryption flow
   - Tests

4. **Test** end-to-end:
   - Unit tests for encryption functions
   - Integration tests with real S3 + Firestore
   - Manual testing of full flow

5. **Document** the pattern
   - Update AGENTS.md and encryption-management-skill.md
   - Add code comments for non-obvious encryption steps

---

## Key Files & Patterns

**Always Reference**:
- [frontend/src/Services/Encryption.ts](frontend/src/Services/Encryption.ts) — Core encryption library
- [frontend/src/Objects/Api/ImageApi.ts](frontend/src/Objects/Api/ImageApi.ts) — FormData + Base64 pattern
- [backend-new/src/Controllers/Uploads/ImageController.ts](backend-new/src/Controllers/Uploads/ImageController.ts) — Receive encrypted blob pattern
- [backend-new/src/Routes/Images.ts](backend-new/src/Routes/Images.ts) — Express route handler pattern

**Key Constants**:
- Nonce length: 12 bytes
- PBKDF2 iterations: 310,000
- Key size: 256-bit (for AES-256-GCM)
- Recovery phrase: 24 words (256 bits entropy)

---

## Tips for Best Results

1. **Always trace the data flow**
   - Frontend encrypts → Base64 encode → FormData → HTTP POST → Backend receives → Base64 decode → Store in S3/Firestore
   - Verify each step for encoding/decoding mismatches

2. **Test encryption in isolation**
   - Test `encryptImage()` separately before integration
   - Test `decryptImage()` with known-good encrypted data
   - This isolates Web Crypto API issues from HTTP/storage issues

3. **Use integration tests**
   - Run `npm run test:integration` regularly
   - These verify S3 + Firestore + encryption metadata in one flow
   - Much faster than manual testing

4. **Validate nonces**
   - Always check nonce length (must be 12 bytes)
   - Verify nonce is random and unique (not hardcoded)
   - Ensure nonce is included in each encryption call

5. **Check Base64 encoding**
   - Before transmission: Uint8Array → Base64
   - Before decryption: Base64 → Uint8Array
   - Verify no truncation or corruption during encoding

6. **Keep backend stateless**
   - Backend should never decrypt (trust-less principle)
   - Backend should only store encrypted blobs + metadata
   - If backend needs to "decrypt", that's an architecture problem

---

## Related Documentation

- **AGENTS.md**: [Project-wide agent instructions](AGENTS.md)
- **Encryption Skill**: [.github/encryption-management-skill.md](.github/encryption-management-skill.md)
- **Backend README**: [backend-new/README.md](backend-new/README.md) — Environment setup, S3 configuration
- **Frontend Tests**: [frontend/tests/integration-test/EncryptionServiceTest.test.ts](frontend/tests/integration-test/EncryptionServiceTest.test.ts)
- **Integration Tests**: [backend-new/__tests__/integration/s3.integration.test.ts](backend-new/__tests__/integration/s3.integration.test.ts)

---

**Agent ID**: `modernize-encryption-manager`  
**Skill Type**: Encryption/Decryption Management  
**Complexity**: High  
**Last Updated**: 2026-04-16
