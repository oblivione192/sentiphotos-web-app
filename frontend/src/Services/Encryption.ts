
export interface AccountRegistrationResult {
  recoveryPhrase: string[];
  passwordSalt: Uint8Array;
  masterKeyCiphertext: Uint8Array;
  masterKeyNonce: Uint8Array;
  masterKey: CryptoKey;
}

export interface ReflectionEncryptionResult {
  encryptedMetadata: Uint8Array;
  metadataNonce: Uint8Array;
  encryptedReflectionKey: Uint8Array;
  reflectionKeyNonce: Uint8Array;
  reflectionKey: CryptoKey;
}

export interface FileEncryptionResult {
  encryptedFile: Uint8Array;
  fileNonce: Uint8Array;
  encryptedFileKey: Uint8Array;
  fileKeyNonce: Uint8Array;
  fileKey: CryptoKey;
}

const PASSWORD_KDF_ITERATIONS = 310000;
const NONCE_LENGTH = 12;

export default class EncryptionService {
  private static wordList = import("../Objects/english.json").then((module) => module.default as string[]);

  public async generateRecoveryPhrase(): Promise<string[]> {
    const entropy = crypto.getRandomValues(new Uint8Array(32));
    return EncryptionService.entropyToPhrase(entropy);
  }

  public static async cryptoKeyToString(key: CryptoKey): Promise<string> {
    const raw = await crypto.subtle.exportKey("raw", key);
    return EncryptionService.toBase64(new Uint8Array(raw));
  }  

  public static async stringToCryptoKey(keyString: string): Promise<CryptoKey> {
    const raw = EncryptionService.fromBase64(keyString);
    return crypto.subtle.importKey(
      "raw",
      raw,
      { name: "AES-GCM" },
      true,
      ["encrypt", "decrypt"]
    );
  }

  public static async registerAccount(password: string): Promise<AccountRegistrationResult> {
    const entropy = crypto.getRandomValues(new Uint8Array(32));
    const recoveryPhrase = await EncryptionService.entropyToPhrase(entropy);
    const masterKey = await EncryptionService.deriveMasterKeyFromEntropy(entropy);

    const passwordSalt = crypto.getRandomValues(new Uint8Array(16));
    const kek = await EncryptionService.derivePasswordKek(password, passwordSalt);
    const masterKeyNonce = crypto.getRandomValues(new Uint8Array(NONCE_LENGTH));
    const masterKeyBytes = await crypto.subtle.exportKey("raw", masterKey);
    const masterKeyCiphertext = new Uint8Array(
      await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: EncryptionService.toArrayBuffer(masterKeyNonce) },
        kek,
        EncryptionService.toArrayBuffer(new Uint8Array(masterKeyBytes)),
      ),
    );

    return {
      recoveryPhrase,
      passwordSalt,
      masterKeyCiphertext,
      masterKeyNonce,
      masterKey,
    };
  }

  public static async encryptMasterKey(password: string): Promise<AccountRegistrationResult> {
    return EncryptionService.registerAccount(password);
  }

  public static async loginWithPassword(params: {
    password: string;
    passwordSalt: Uint8Array;
    masterKeyCiphertext: Uint8Array;
    masterKeyNonce: Uint8Array;
  }): Promise<CryptoKey> {

    const kek = await EncryptionService.derivePasswordKek(
      params.password,
      params.passwordSalt
    );    

    
    const masterKeyRaw = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: params.masterKeyNonce
      },
      kek,
      params.masterKeyCiphertext
    );  
  
    return crypto.subtle.importKey(
      "raw",
      masterKeyRaw,
      { name: "AES-GCM" },
      true,
      ["encrypt", "decrypt"]
    );
  }

  public static async encryptCollection(master: {
    masterKey: CryptoKey | string;
    metadata: unknown;
  }): Promise<ReflectionEncryptionResult> {  
    const masterKey = typeof master.masterKey === 'string'
      ? await EncryptionService.stringToCryptoKey(master.masterKey)
      : master.masterKey;
    //check if it is a string and convert it to CryptoKey if necessary

    const reflectionKey = await EncryptionService.generateAesKey();
    const metadataNonce = crypto.getRandomValues(new Uint8Array(NONCE_LENGTH));
    const metadataBytes = new TextEncoder().encode(JSON.stringify(master.metadata));
    const encryptedMetadata = new Uint8Array(
      await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: EncryptionService.toArrayBuffer(metadataNonce) },
        reflectionKey,
        EncryptionService.toArrayBuffer(metadataBytes),
      ),
    );

    const reflectionKeyNonce = crypto.getRandomValues(new Uint8Array(NONCE_LENGTH));
    const reflectionKeyRaw = await crypto.subtle.exportKey("raw", reflectionKey);
    const encryptedReflectionKey = new Uint8Array(
      await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: EncryptionService.toArrayBuffer(reflectionKeyNonce) },
        masterKey,
        EncryptionService.toArrayBuffer(new Uint8Array(reflectionKeyRaw)),
      ),
    );

    return {
      encryptedMetadata,
      metadataNonce,
      encryptedReflectionKey,
      reflectionKeyNonce,
      reflectionKey,
    };
  }

  public static async createEncryptedCollection(master: {
    masterKey: CryptoKey;
    metadata: unknown;
  }): Promise<ReflectionEncryptionResult> {
    return EncryptionService.encryptCollection(master);
  }

  public static async decryptCollection(
    masterKey: CryptoKey,
    nonce: {
      encryptedReflectionKey: Uint8Array;
      reflectionKeyNonce: Uint8Array;
      encryptedMetadata: Uint8Array;
      metadataNonce: Uint8Array;
    },
  ): Promise<{ reflectionKey: CryptoKey; metadata: unknown }> {
    const reflectionKey = await EncryptionService.decryptReflectionKey(
      masterKey,
      nonce.encryptedReflectionKey,
      nonce.reflectionKeyNonce,
    );

    const metadata = await EncryptionService.decryptJson(
      reflectionKey,
      nonce.encryptedMetadata,
      nonce.metadataNonce,
    );

    return { reflectionKey, metadata };
  }
 
  
  public static async encryptImage(reflection: {
    reflectionKey: CryptoKey;
    fileData: Blob | ArrayBuffer | Uint8Array;
  }): Promise<FileEncryptionResult> {
    const fileKey = await EncryptionService.generateAesKey();
    const fileBytes = await EncryptionService.toUint8Array(reflection.fileData);

    const fileNonce = crypto.getRandomValues(new Uint8Array(NONCE_LENGTH));
    const encryptedFile = new Uint8Array(
      await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: EncryptionService.toArrayBuffer(fileNonce) },
        fileKey,
        EncryptionService.toArrayBuffer(fileBytes),
      ),
    );

    const fileKeyNonce = crypto.getRandomValues(new Uint8Array(NONCE_LENGTH));
    const fileKeyRaw = await crypto.subtle.exportKey("raw", fileKey);
    const encryptedFileKey = new Uint8Array(
      await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: EncryptionService.toArrayBuffer(fileKeyNonce) },
        reflection.reflectionKey,
        EncryptionService.toArrayBuffer(new Uint8Array(fileKeyRaw)),
      ),
    );

    return {
      encryptedFile,
      fileNonce,
      encryptedFileKey,
      fileKeyNonce,
      fileKey,
    };
  }

  public static async createEncryptedImage(collection: {
    collectionKey: CryptoKey;
    fileData: Blob | ArrayBuffer | Uint8Array;
  }): Promise<FileEncryptionResult> {
    return EncryptionService.encryptImage({
      reflectionKey: collection.collectionKey,
      fileData: collection.fileData,
    });
  }

  public static async decryptImage(
    reflectionKey: CryptoKey,
    nonce: {
      encryptedFileKey: Uint8Array;
      fileKeyNonce: Uint8Array;
      encryptedFile: Uint8Array;
      fileNonce: Uint8Array;
    },
  ): Promise<Uint8Array> {
    const fileKey = await EncryptionService.decryptFileKey(
      reflectionKey,
      nonce.encryptedFileKey,
      nonce.fileKeyNonce,
    );

    console.log(nonce); 

    return EncryptionService.decryptBytes(fileKey, nonce.encryptedFile, nonce.fileNonce);
  }



  public static async phraseToEntropy(words: string[]): Promise<Uint8Array> {
    if (words.length !== 24) {
      throw new Error("Recovery phrase must contain 24 words");
    }

    const wordList = await EncryptionService.wordList;
    const bits = words
      .map((word) => {
        const index = wordList.indexOf(word);
        if (index === -1) {
          throw new Error("Invalid recovery phrase word");
        }
        return index.toString(2).padStart(11, "0");
      })
      .join("");

    const entropyBits = bits.slice(0, 256);
    const checksumBits = bits.slice(256, 264);

    const entropy = new Uint8Array(32);
    for (let i = 0; i < 32; i += 1) {
      entropy[i] = parseInt(entropyBits.slice(i * 8, (i + 1) * 8), 2);
    }

    const hash = new Uint8Array(
      await crypto.subtle.digest("SHA-256", EncryptionService.toArrayBuffer(entropy)),
    );
    const expectedChecksum = EncryptionService.byteToBits(hash[0]).slice(0, 8);
    if (checksumBits !== expectedChecksum) {
      throw new Error("Invalid recovery phrase checksum");
    }

    return entropy;
  }

  public static async entropyToPhrase(entropy: Uint8Array): Promise<string[]> {
    if (entropy.length !== 32) {
      throw new Error("Entropy must be 32 bytes for a 24-word phrase");
    }

    const hash = new Uint8Array(
      await crypto.subtle.digest("SHA-256", EncryptionService.toArrayBuffer(entropy)),
    );
    const checksumBits = EncryptionService.byteToBits(hash[0]).slice(0, 8);
    const entropyBits = Array.from(entropy).map(EncryptionService.byteToBits).join("");
    const fullBits = entropyBits + checksumBits;

    const wordList = await EncryptionService.wordList;
    const words: string[] = [];
    for (let i = 0; i < 264; i += 11) {
      const index = parseInt(fullBits.slice(i, i + 11), 2);
      words.push(wordList[index]);
    }

    return words;
  }

  public static async deriveMasterKeyFromEntropy(entropy: Uint8Array): Promise<CryptoKey> {
    if (entropy.length !== 32) {
      throw new Error("Entropy must be 32 bytes");
    }

    const context = new TextEncoder().encode("sentiphotos-master-key-v1");
    const combined = new Uint8Array(entropy.length + context.length);
    combined.set(entropy, 0);
    combined.set(context, entropy.length);

    const masterKeyRaw = await crypto.subtle.digest(
      "SHA-256",
      EncryptionService.toArrayBuffer(combined),
    );
    return crypto.subtle.importKey("raw", masterKeyRaw, { name: "AES-GCM" }, true, ["encrypt", "decrypt"]);
  }

  public static async decryptReflectionKey(
    masterKey: CryptoKey,
    encryptedReflectionKey: Uint8Array,
    reflectionKeyNonce: Uint8Array,
  ): Promise<CryptoKey> {
    const raw = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: reflectionKeyNonce },
      masterKey,
      encryptedReflectionKey,
    );
    return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, true, ["encrypt", "decrypt"]);
  }

  public static async decryptCollectionKey(
    masterKey: CryptoKey,
    encryptedCollectionKey: Uint8Array,
    collectionKeyNonce: Uint8Array,
  ): Promise<CryptoKey> {
    return EncryptionService.decryptReflectionKey(
      masterKey,
      encryptedCollectionKey,
      collectionKeyNonce,
    );
  }

  public static async decryptFileKey(
    reflectionKey: CryptoKey,
    encryptedFileKey: Uint8Array,
    fileKeyNonce: Uint8Array,
  ): Promise<CryptoKey> {
    const raw = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: EncryptionService.toArrayBuffer(fileKeyNonce) },
      reflectionKey,
      EncryptionService.toArrayBuffer(encryptedFileKey),
    );
    return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, true, ["encrypt", "decrypt"]);
  }

  public static async decryptJson(
    key: CryptoKey,
    encryptedPayload: Uint8Array,
    nonce: Uint8Array,
  ): Promise<unknown> {
    const plain = await EncryptionService.decryptBytes(key, encryptedPayload, nonce);
    return JSON.parse(new TextDecoder().decode(plain));
  }

  public static async decryptBytes(
    key: CryptoKey,
    encryptedPayload: Uint8Array,
    nonce: Uint8Array,
  ): Promise<Uint8Array> {
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: EncryptionService.toArrayBuffer(nonce) },
      key,
      EncryptionService.toArrayBuffer(encryptedPayload),
    );
    return new Uint8Array(plain);
  }

  public static toBase64(data: Uint8Array): string {
    let binary = "";
    data.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  }

  public static fromBase64(value: string): Uint8Array {
    const binary = atob(value);
    const output = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      output[i] = binary.charCodeAt(i);
    }
    return output;
  }

  private static async derivePasswordKek(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const passwordKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveKey"],
    );

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: EncryptionService.toArrayBuffer(salt),
        iterations: PASSWORD_KDF_ITERATIONS,
        hash: "SHA-256",
      },
      passwordKey,
      {
        name: "AES-GCM",
        length: 256,
      },
      false,
      ["encrypt", "decrypt"],
    );
  }

  public static async generateReflectionKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"],
    );
  }

  private static async generateAesKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"],
    );
  }

  private static async toUint8Array(data: Blob | ArrayBuffer | Uint8Array): Promise<Uint8Array> {
    if (data instanceof Uint8Array) {
      return data;
    }

    if (data instanceof Blob) {
      return new Uint8Array(await data.arrayBuffer());
    }

    return new Uint8Array(data);
  }

  private static byteToBits(byte: number): string {
    return byte.toString(2).padStart(8, "0");
  }

  private static toArrayBuffer(data: Uint8Array): ArrayBuffer {
    const output = new ArrayBuffer(data.byteLength);
    new Uint8Array(output).set(
      new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
    );
    return output;
  }
}