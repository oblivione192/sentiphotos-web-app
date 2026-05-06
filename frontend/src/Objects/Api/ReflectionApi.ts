import type { AxiosInstance } from "axios";
import dayjs from "dayjs";
import { ReflectionFilterModel } from "../Filters/ReflectionFilter";
import { ReflectionModel } from "../Models/ReflectionModel";
import EncryptionService from "../../Services/Encryption";
import type {ReflectionResponseModel, ReflectionQueryModel} from '../Models/ReflectionResponse';
export default class ReflectionApi {
	private static url = "/api/reflection";

	// 🔧 Injected dependency
	private static axios: AxiosInstance;

	/**
	 * Initialize with Axios instance (production/test)
	 */
	public static init(axiosInstance: AxiosInstance) {
		this.axios = axiosInstance;
	}

	/**
	 * Safe accessor
	 */
	private static get client(): AxiosInstance {
		if (!this.axios) {
			throw new Error("ReflectionApi not initialized. Call ReflectionApi.init(axiosInstance)");
		}
		return this.axios;
	}

	private static toReflectionModel(reflectionData: ReflectionResponseModel): ReflectionModel {
		const reflection = new ReflectionModel();

		reflection.reflectionId = reflectionData.id ?? null;
		reflection.title = reflectionData.title ?? null;
		reflection.description = reflectionData.description ?? null;
		reflection.createdAt = reflectionData.createdAt ? dayjs(reflectionData.createdAt) : null;
		reflection.updatedAt = reflectionData.updatedAt ? dayjs(reflectionData.updatedAt) : null; 
		reflection.encryptedMetadata = reflectionData.encryptedMetadata; 
		reflection.encryptedReflectionKey = reflectionData.encryptedReflectionKey;  
		reflection.metadataNonce = reflectionData.metadataNonce;
		reflection.reflectionKeyNonce = reflectionData.reflectionKeyNonce;   


		return reflection;
	}

	private static buildFilterParams(filter?: Partial<ReflectionFilterModel>): ReflectionQueryModel {
		if (!filter) return {};

		const params: ReflectionQueryModel = {};

		if (filter.userId) params.userId = filter.userId;
		if (filter.reflectionId) params.id = filter.reflectionId;
		if (filter.title) params.title = filter.title;
		if (filter.content) params.description = filter.content;
		if (filter.page !== undefined) params.page = filter.page;
		if (filter.limit !== undefined) params.limit = filter.limit;

		return params;
	}

	public static async createReflection(
		reflection: ReflectionModel,
		masterKey?: CryptoKey,
	): Promise<ReflectionModel> {
		try {
			let body: Record<string, unknown>;

			if (masterKey) {
				const encrypted = await EncryptionService.encryptCollection({
					masterKey,
					metadata: {
						title: reflection.title,
						description: reflection.description,
					},
				});

				body = {
					encryptedMetadata: EncryptionService.toBase64(encrypted.encryptedMetadata),
					metadataNonce: EncryptionService.toBase64(encrypted.metadataNonce),
					encryptedReflectionKey: EncryptionService.toBase64(encrypted.encryptedReflectionKey),
					reflectionKeyNonce: EncryptionService.toBase64(encrypted.reflectionKeyNonce),
					encrypted: true,
				};
			} else {
				body = {
					title: reflection.title,
					description: reflection.content,
					encrypted: false,
				};
			}

			const response = await this.client.post(this.url, body);

			return this.toReflectionModel(response.data as ReflectionResponseModel);
		} catch (error) {
			console.error("Error creating reflection:", error);
			throw new Error("Failed to create reflection");
		}
	}

	public static async updateReflection(
		reflectionId: string,
		reflection: ReflectionModel,
		masterKey?: CryptoKey,
	): Promise<ReflectionModel> {
		try {
			let body: Record<string, unknown>;

			if (masterKey) {
				const encrypted = await EncryptionService.encryptCollection({
					masterKey,
					metadata: {
						title: reflection.title,
						description: reflection.description,
					},
				});

				body = {
					encryptedMetadata: EncryptionService.toBase64(encrypted.encryptedMetadata),
					metadataNonce: EncryptionService.toBase64(encrypted.metadataNonce),
					encryptedReflectionKey: EncryptionService.toBase64(encrypted.encryptedReflectionKey),
					reflectionKeyNonce: EncryptionService.toBase64(encrypted.reflectionKeyNonce),
					encrypted: true,
				};
			} else {
				body = {
					title: reflection.title,
					description: reflection.description,
					encrypted: false,
				};
			}

			const response = await this.client.patch(
				`${this.url}/${reflectionId}`,
				body
			);

			return this.toReflectionModel(response.data as ReflectionResponseModel);
		} catch (error) {
			console.error("Error updating reflection:", error);
			throw new Error("Failed to update reflection");
		}
	}

	public static async deleteReflection(reflectionId: string): Promise<void> {
		try {
			await this.client.delete(`${this.url}/${reflectionId}`);
		} catch (error) {
			console.error("Error deleting reflection:", error);
			throw new Error("Failed to delete reflection");
		}
	}

	public static async getReflection(reflectionId: string): Promise<ReflectionModel> {
		try {
			const response = await this.client.get(`${this.url}/${reflectionId}`);

			return this.toReflectionModel(response.data as ReflectionResponseModel);
		} catch (error) {
			console.error("Error getting reflection:", error);
			throw new Error("Failed to fetch reflection");
		}
	}

	public static async getAllReflections(
		filter?: Partial<ReflectionFilterModel>
	): Promise<ReflectionModel[]> {
		try {
			const response = await this.client.get(`${this.url}/reflections`, {
				params: this.buildFilterParams(filter),
			});

			return (response.data as ReflectionResponseModel[]).map((r) =>
				this.toReflectionModel(r)
			);
		} catch (error) {
			console.error("Error getting reflections:", error);
			throw new Error("Failed to fetch reflections");
		}
	}
}