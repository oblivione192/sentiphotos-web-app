export default class UserModel {
    id: string
    username: string
    email: string 
    passwordHash: string 
    passwordSalt: string;
    masterKeyCipherText: string | null; 
    masterKeyNonce: string | null;

    constructor(
        id: string, 
        username: string, 
        passwordHash: string, 
        email: string,
        passwordSalt: string,
        masterKeyCipherText: string | null = null,
        masterKeyNonce: string | null = null
    ) {
        this.id = id
        this.username = username
        this.email = email 
        this.passwordHash = passwordHash  
        this.passwordSalt = passwordSalt;
        this.masterKeyCipherText = masterKeyCipherText;
        this.masterKeyNonce = masterKeyNonce; 
    }   

    public toObject(): object {
        return {
            id: this.id,
            username: this.username,
            email: this.email,
            passwordHash: this.passwordHash,
            passwordSalt: this.passwordSalt,
            masterKeyCipherText: this.masterKeyCipherText,
            masterKeyNonce: this.masterKeyNonce
        }
    }

}