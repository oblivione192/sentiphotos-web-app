import admin from "firebase-admin";
import { getApps } from "firebase-admin/app";
import { cert } from "firebase-admin/app";
import BaseFilterModel from "../../Models/Filters/BaseFilterModel.js";
import { env } from "../../env.js";
import fs from "fs";

/* ---------- Load Service Account ---------- */
const serviceAccountPath = env.FIRESTORE_SERVICE_ACCOUNT_PATH;

if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
  throw new Error(`Service account file not found at path: ${serviceAccountPath}`);
}

const serviceAccount = JSON.parse(
  fs.readFileSync(serviceAccountPath, "utf-8")
);

/* ---------- Singleton Class ---------- */
export class FirestoreDBManagerSingleton { 

  private static firestore: admin.firestore.Firestore | null = null;
  private static connected = false;

  /* ---------- Internal Init ---------- */
  private static getFirestore(): admin.firestore.Firestore {
    if (!this.firestore) {
      if (getApps().length === 0) {
        admin.initializeApp({
          credential: cert(serviceAccount),
        });
      }
      this.firestore = admin.firestore();
    }
    return this.firestore;
  }

  /* ---------- Connection ---------- */
  public static async connect(): Promise<void> {
    this.getFirestore();
    this.connected = true;
  }

  public static async disconnect(): Promise<void> {
    this.connected = false;
  }

  public static isConnected(): boolean {
    return this.connected;
  }

  /* ---------- CREATE ---------- */
  public static async store(
    collection: string,
    data: object,
    id?: string
  ): Promise<void> {
    const db = this.getFirestore();  
    const ref = id
      ? db.collection(collection).doc(id)
      : db.collection(collection).doc();
    await ref.set(data); 
  }

  /* ---------- READ ONE ---------- */
  public static async getOne<T>(
    collection: string,
    id: string
  ): Promise<T | null> {
    const db = this.getFirestore();
    const doc = await db.collection(collection).doc(id).get();
    return doc.exists ? (doc.data() as T) : null;
  }

  /* ---------- READ MANY ---------- */
  public static async getAll<T>(
    collection: string,
    filter?: Partial<BaseFilterModel>
  ): Promise<T[]> {
    const db = this.getFirestore();
    let query: admin.firestore.Query = db.collection(collection); 
     
    console.log(collection); 
    console.log(filter); 

    const fieldsForFilter = Object.entries(filter || {})
      .filter(([key, value]) => 
        value !== undefined &&
        key !== 'limit' &&
        key !== 'offset' &&
        key !== 'sortOrder' &&
        key !== 'page'
      )
      .map(([key]) => key);

    console.log("Fields for filter:", fieldsForFilter);


    if (fieldsForFilter.length > 0) {
      for (const [key, value] of Object.entries(filter || {})) {
        if (fieldsForFilter.includes(key)) {
          query = query.where(key, "==", value);
        }
      }
    }

    if (filter?.sortOrder) {
      query = query.orderBy("createdAt", filter.sortOrder);
    }

    if (filter?.limit) {
      query = query.limit(filter.limit);
    }

    if (filter?.page) {
      query = query.offset((filter.page - 1) * (filter.limit || 10));
    }

    const snapshot = await query.get(); 
    return snapshot.docs.map((doc) => doc.data() as T);
  }

  /* ---------- UPDATE ---------- */
  public static async patch(
    collection: string,
    id: string,
    data: object
  ): Promise<void> {
    const db = this.getFirestore();
    await db.collection(collection).doc(id).update(data);
  }

  /* ---------- DELETE ---------- */
  public static async delete(
    collection: string,
    id: string
  ): Promise<void> {
    const db = this.getFirestore();
    await db.collection(collection).doc(id).delete();
  }

  public static async deleteRecursively(
  collection: string,
  id: string
 ): Promise<void> {

    const db = this.getFirestore();
    const docRef = db.collection(collection).doc(id);

    await db.recursiveDelete(docRef);  
     
  }
}