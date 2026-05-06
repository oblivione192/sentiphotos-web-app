
export interface BaseDBManager{
     connect(): Promise<void>; 
     disconnect(): Promise<void>; 
     isConnected(): boolean; 
     store<T>(data: T): Promise<void>;
     getOne<T>(id: string): Promise<T | null>; 
     getAll<T>(filter: object): Promise<T[]>; 
     patch<T>(id: string, data: Partial<T>): Promise<void>;
     delete(id: string): Promise<void>;   
}
