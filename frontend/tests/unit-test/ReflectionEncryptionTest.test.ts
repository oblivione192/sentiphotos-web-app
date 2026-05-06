import { describe, it, expect, beforeAll } from "vitest";
import EncryptionService from "../../src/Services/Encryption";
import dayjs from "dayjs";

describe("EncryptionService - real encryption", () => {
    let masterKeyBase64: string;

    beforeAll(async () => {
        // 🔐 Generate real AES key
        const key = await crypto.subtle.generateKey(
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );

        // 🔐 Export to raw bytes
        const exported = await crypto.subtle.exportKey("raw", key);

        // 🔐 Convert to base64 (format your system expects)
        masterKeyBase64 = btoa(
            String.fromCharCode(...new Uint8Array(exported))
        );
    });

    it("should encrypt the reflection and its metadata correctly", async () => {
        const result = await EncryptionService.encryptCollection({
            masterKey: masterKeyBase64,
            metadata: {
                title: "Test Reflection",
                description: "This is a test reflection.",
                createdAt: dayjs(),
                updatedAt: dayjs()
            }
        });

        expect(result).toBeDefined();
        expect(result.encryptedMetadata).toBeDefined();
        expect(result.encryptedReflectionKey).toBeDefined();
        expect(result.metadataNonce).toBeDefined();
        expect(result.reflectionKey).toBeDefined();
    });
});


