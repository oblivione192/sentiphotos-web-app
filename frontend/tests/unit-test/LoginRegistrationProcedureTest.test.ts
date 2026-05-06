//this is a live test file for login and registration
import { describe, it, expect, beforeEach, vi, afterAll, beforeAll } from 'vitest';
import EncryptionService from '../../src/Services/Encryption';
import axios, { AxiosInstance } from 'axios';
import AuthenticationApi from '../../src/Objects/Api/AuthenticationApi';
describe('AuthenticationApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });   
   
    let cookies: string = '';
    let client: AxiosInstance; 
    const baseUrl = 'http://localhost:3005/auth/users';

    beforeAll(() => {  
        client = axios.create({
            baseURL: 'http://localhost:3005',
            withCredentials: true,
        });
    
        // Mock the console.log function to prevent actual logging during tests
        vi.spyOn(console, 'log').mockImplementation(() => {}); 
    });

    it('should generate the master key and recovery phrase correctly during registration', async () => {  
    
        const password = 'TestPassword!123';  

        const result = await EncryptionService.registerAccount(password);

        expect(result.recoveryPhrase).toBeDefined();
        expect(result.recoveryPhrase).toHaveLength(24);
        expect(result.masterKeyCiphertext).toBeDefined();
        expect(result.masterKeyNonce).toBeDefined(); 
        expect(result.masterKey).toBeDefined(); 

    
        vi.spyOn(result.recoveryPhrase!, 'join').mockReturnValue('mocked recovery phrase');
    }); 

    it('should login successfully and return token and master key', async () => {
        const username = 'testuser456'; 
        const email = 'testuser123456@gmail.com'; 
        const password = 'TestPassword!123456';

        const result = await EncryptionService.registerAccount(password);  
            
        //  const registrationResponse = await client.post(
        //         `${baseUrl}/register`,
        //         { 
        //             username: username, 
        //             email: email, 
        //             password: password, 
        //             passwordSalt: EncryptionService.toBase64(result.passwordSalt),
        //             masterKeyCipherText: EncryptionService.toBase64(result.masterKeyCiphertext),
        //             masterKeyNonce: EncryptionService.toBase64(result.masterKeyNonce)
        //         }
        //     ); 

        //     expect(registrationResponse.status).toBe(200); 

            const loginResponse = await client.post(
                `${baseUrl}/login`,
                { username, password },
                { withCredentials: true }
            );

            expect(loginResponse.data.token).toBeDefined();
            expect(loginResponse.data.masterKeyCipherText).toBeDefined();  
            expect(loginResponse.data.masterKeyNonce).toBeDefined();
            expect(loginResponse.data.passwordSalt).toBeDefined();   
 
             
            //need to convert all to uint8array before passing to loginWithPassword
            const masterKey = await EncryptionService.loginWithPassword({
                password,
                masterKeyCiphertext: EncryptionService.fromBase64(loginResponse.data.masterKeyCipherText),
                masterKeyNonce: EncryptionService.fromBase64(loginResponse.data.masterKeyNonce),
                passwordSalt: EncryptionService.fromBase64(loginResponse.data.passwordSalt)
            });  

            expect(masterKey).toBeDefined();
            expect(masterKey).toEqual(result.masterKey);
         

     });

       
    });  