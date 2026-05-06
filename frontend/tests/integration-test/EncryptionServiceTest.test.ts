import { describe, expect, it } from "vitest";
import EncryptionService from "../../src/Services/Encryption";

describe("EncryptionService Integration Tests", () => {
	it("encryptMasterKey should produce a 24-word phrase and a decryptable master key", async () => {
		const password = "CorrectHorseBatteryStaple!123";

		const result = await EncryptionService.encryptMasterKey(password);

		expect(result.recoveryPhrase).toHaveLength(24);
		expect(result.passwordSalt).toHaveLength(16);
		expect(result.masterKeyNonce).toHaveLength(12);
		expect(result.masterKeyCiphertext.length).toBeGreaterThan(0);

		const decryptedMasterKey = await EncryptionService.loginWithPassword({
			password,
			passwordSalt: result.passwordSalt,
			masterKeyCiphertext: result.masterKeyCiphertext,
			masterKeyNonce: result.masterKeyNonce,
		});

		const rawOriginal = new Uint8Array(await crypto.subtle.exportKey("raw", result.masterKey));
		const rawDecrypted = new Uint8Array(await crypto.subtle.exportKey("raw", decryptedMasterKey));
		expect(Array.from(rawDecrypted)).toEqual(Array.from(rawOriginal));
	});

	it("encryptCollection and decryptCollection should round-trip metadata", async () => {
		const { masterKey } = await EncryptionService.encryptMasterKey("AnotherStrongPassword!234");

		const metadata = {
			name: "Summer Collection",
			tags: ["travel", "sunset"],
			createdAt: "2026-04-08T00:00:00.000Z",
		};

		const encryptedCollection = await EncryptionService.encryptCollection({
			masterKey,
			metadata,
		});

		expect(encryptedCollection.metadataNonce).toHaveLength(12);
		expect(encryptedCollection.reflectionKeyNonce).toHaveLength(12);
		expect(encryptedCollection.encryptedMetadata.length).toBeGreaterThan(0);
		expect(encryptedCollection.encryptedReflectionKey.length).toBeGreaterThan(0);

		const decrypted = await EncryptionService.decryptCollection(masterKey, {
			encryptedReflectionKey: encryptedCollection.encryptedReflectionKey,
			reflectionKeyNonce: encryptedCollection.reflectionKeyNonce,
			encryptedMetadata: encryptedCollection.encryptedMetadata,
			metadataNonce: encryptedCollection.metadataNonce,
		});

		expect(decrypted.metadata).toEqual(metadata);
	});

	it("encryptImage and decryptImage should round-trip image bytes", async () => {
		const { masterKey } = await EncryptionService.encryptMasterKey("ImagePassword!345");

		const encryptedCollection = await EncryptionService.encryptCollection({
			masterKey,
			metadata: { name: "Photos" },
		});

		const originalBytes = new Uint8Array([1, 2, 3, 4, 255, 128, 64, 32, 16, 8]);

		const encryptedImage = await EncryptionService.encryptImage({
			reflectionKey: encryptedCollection.reflectionKey,
			fileData: originalBytes,
		});

		expect(encryptedImage.fileNonce).toHaveLength(12);
		expect(encryptedImage.fileKeyNonce).toHaveLength(12);
		expect(encryptedImage.encryptedFile.length).toBeGreaterThan(0);
		expect(encryptedImage.encryptedFileKey.length).toBeGreaterThan(0);

		const decryptedBytes = await EncryptionService.decryptImage(encryptedCollection.reflectionKey, {
			encryptedFileKey: encryptedImage.encryptedFileKey,
			fileKeyNonce: encryptedImage.fileKeyNonce,
			encryptedFile: encryptedImage.encryptedFile,
			fileNonce: encryptedImage.fileNonce,
		});

		expect(Array.from(decryptedBytes)).toEqual(Array.from(originalBytes));
	});

	it("phraseToEntropy should reject an invalid checksum", async () => {
		const { recoveryPhrase } = await EncryptionService.encryptMasterKey("ChecksumPassword!456");
		const tampered = [...recoveryPhrase];
		tampered[0] = tampered[0] === "abandon" ? "ability" : "abandon";

		await expect(EncryptionService.phraseToEntropy(tampered)).rejects.toThrow(
			"Invalid recovery phrase checksum",
		);
	});
});
