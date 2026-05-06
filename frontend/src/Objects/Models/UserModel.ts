export class UserModel{
    public userId: string | null = null;
    public username: string | null = null;
    public email: string | null = null;
    public createdAt: Date | null = null;
    public masterKey: CryptoKey | null = null; 
}