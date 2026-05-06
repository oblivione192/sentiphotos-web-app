import { FirestoreDBManagerSingleton } from "./DBManagers/FirestoreDBManagerSingleton.js";
import { ImageModel } from "../Models/ImageModel.js";
import { ImageFilter } from "../Models/Filters/ImageFilter.js";
import {Constants} from "../Constants.js";

export class ImageRepository {
  private static COLLECTION_NAME = "images";

  public static getDBManager(): FirestoreDBManagerSingleton {
    return FirestoreDBManagerSingleton;
  }

  private static getImagesCollectionPath(userId: string, reflectionId: string): string {
    // app/{userId}/reflections/{reflectionId}/images
    return `${Constants.ROOT_COLLECTION}/${userId}/reflections/${reflectionId}/${ImageRepository.COLLECTION_NAME}`;
  }

  private static toSafeKey(imageId: string): string {
    return imageId.replace(/\//g, "_");
  }

  public static async saveImageMetadata(
    userId: string,
    reflectionId: string,
    image: ImageModel
  ): Promise<void> { 
    
    const path = this.getImagesCollectionPath(userId, reflectionId);
    const safeKey = this.toSafeKey(image.imageId);

    return await FirestoreDBManagerSingleton.store(path, image.toObject(), safeKey);
  }

  public static async getImageMetadata(
    userId: string,
    reflectionId: string,
    imageId: string
  ): Promise<ImageModel | null> {
    const path = this.getImagesCollectionPath(userId, reflectionId);
    const safeKey = this.toSafeKey(imageId);

    const data: ImageModel | null =
      await FirestoreDBManagerSingleton.getOne<ImageModel>(path, safeKey);

    if (!data) return null;

   
    return data; 
  }

  public static async getAllImageMetadata(
    filter: Partial<ImageFilter>
  ): Promise<ImageModel[]> {
    if (!filter.userId || !filter.reflectionId) {
      throw new Error("userId and reflectionId are required");
    }

    const path = this.getImagesCollectionPath(filter.userId, filter.reflectionId);
 
    //need to exclude userId and reflectionId from filter since they are already part of the path

    const restFilter = { ...filter };
    delete restFilter.userId;
    delete restFilter.reflectionId;

    return await FirestoreDBManagerSingleton.getAll<ImageModel>(path, restFilter);
  }

  public static async deleteImageMetadata(
    userId: string,
    reflectionId: string,
    imageId: string
  ): Promise<void> {
    const path = this.getImagesCollectionPath(userId, reflectionId);
    const safeKey = this.toSafeKey(imageId);

    return FirestoreDBManagerSingleton.delete(path, safeKey);
  }

  public static async updateImageMetadata(
    userId: string,
    reflectionId: string,
    image: ImageModel
  ): Promise<void> {
    const path = this.getImagesCollectionPath(userId, reflectionId);
    const safeKey = this.toSafeKey(image.imageId);  

    const existingImage = await FirestoreDBManagerSingleton.getOne<ImageModel>(path, safeKey);

    if (!existingImage) {
      throw new Error("Image not found");
    }

    image.createdAt = existingImage.createdAt;
    image.updatedAt = new Date();

    return await FirestoreDBManagerSingleton.patch(path, safeKey, image.toObject());
  }
}