import type { AxiosInstance } from "axios";
import EncryptionService from "../../Services/Encryption";

type LoginResponse = {
    token?: string;
    masterKey?: CryptoKey; 
};

type RegisterResponse = {
    twentyFourWordPhrase?: string[];
};

export default class AuthenticationApi {
    private static baseUrl = "/auth/users";
    private static axios: AxiosInstance;

    /**
     * Inject axios instance (production or test)
     */
    public static init(axiosInstance: AxiosInstance) {
        this.axios = axiosInstance;
    }

    /**
     * Internal guard to ensure axios is injected
     */
    private static get client(): AxiosInstance {
        if (!this.axios) {
            throw new Error("AuthenticationApi not initialized. Call AuthenticationApi.init(axiosInstance)");
        }
        return this.axios;
    }

    public static async login(username: string, password: string): Promise<LoginResponse> {
        try {
            const response = await this.client.post(
                `${this.baseUrl}/login`,
                { username, password }
            );

            console.log(response.data); // Debug log to verify response data structure

            if (response.status === 200 && response.data.token) {
                
                const masterKey = await EncryptionService.loginWithPassword({
                    password,
                    passwordSalt: EncryptionService.fromBase64(response.data.passwordSalt),
                    masterKeyCiphertext: EncryptionService.fromBase64(response.data.masterKeyCipherText),
                    masterKeyNonce: EncryptionService.fromBase64(response.data.masterKeyNonce),
                });

                return {
                    token: response.data.token,
                    masterKey: masterKey
                };
            }

            throw new Error("Login failed: No token received");
        } catch (error: any) {  
            console.log(error); 
            console.error("Login error:", error.response?.data || error.message);
            throw new Error(error.response?.data?.error || "Login failed");
        }
    }

    public static async register(
        username: string,
        email: string,
        password: string
    ): Promise<RegisterResponse> {
        try {
            const result = await EncryptionService.registerAccount(password);

            const response = await this.client.post(
                `${this.baseUrl}/register`,
                {
                    username,
                    email,
                    password,
                    passwordSalt: EncryptionService.toBase64(result.passwordSalt),
                    masterKeyCipherText: EncryptionService.toBase64(result.masterKeyCiphertext),
                    masterKeyNonce: EncryptionService.toBase64(result.masterKeyNonce) 
                }
            );

            if (response.status === 200 && response.data.message) {
                return { twentyFourWordPhrase: result.recoveryPhrase };
            }

            throw new Error("Registration failed: No message received");
        } catch (error: AxiosError | any) {
            console.log(error);
            console.error("Registration error:", error.response?.data || error.message);
            throw new Error(error.response?.data?.error || "Registration failed");
        }
    }

    public static async logout(): Promise<void> {
        try {
            const response = await this.client.post(
                `${this.baseUrl}/logout`,
                {},
                { withCredentials: true }
            );

            if (response.status !== 200) {
                throw new Error("Logout failed: Unexpected response");
            }

            console.log("Logout successful");
        } catch (error: any) {
            console.error("Logout error:", error.response?.data || error.message);
            throw new Error(error.response?.data?.error || "Logout failed");
        }
    }

    public static async deleteAccount(): Promise<void> {
        try {
            const response = await this.client.delete(
                `${this.baseUrl}/account`,
                { withCredentials: true }
            );

            if (response.status !== 200) {
                throw new Error("Account deletion failed: Unexpected response");
            }

            console.log("Account deletion successful");
        } catch (error: any) {
            console.error("Account deletion error:", error.response?.data || error.message);
            throw new Error(error.response?.data?.error || "Account deletion failed");
        }
    }
}