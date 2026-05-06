import {it, describe, expect, beforeAll} from 'vitest';  

import axios from 'axios';  
import { afterAll } from 'vitest';
import {AxiosInstance} from 'axios'; 
import ReflectionApi from "../../src/Objects/Api/ReflectionApi"; 
import { ReflectionModel } from '../../src/Objects/Models/ReflectionModel'; 
import AuthenticationApi from '../../src/Objects/Api/AuthenticationApi';
import EncryptionService from '../../src/Services/Encryption';
describe('ReflectionApi - live API calls', () => {

    let axiosClient: AxiosInstance; 
    let masterKey: CryptoKey; 
    let token: string;    

    const originalReflectionModel: ReflectionModel = new ReflectionModel(); 
    
    let createdReflection: ReflectionModel; 

    beforeAll(async () => { 
  
        axiosClient = axios.create({
            baseURL: 'http://localhost:3005',
            withCredentials: true,
        }); 


        AuthenticationApi.init(axiosClient);    
        const loginResult = await AuthenticationApi.login('testuser456', 'TestPassword!123456');

        axiosClient = axios.create({
            baseURL: 'http://localhost:3005', 
            headers: {
                Cookie: `token=${loginResult.token}`
            }
        });

        ReflectionApi.init(axiosClient); 
 
        token = loginResult.token!;
        masterKey = loginResult.masterKey!;
        
        expect(token).toBeDefined();
        expect(masterKey).toBeDefined();

    });  

    afterAll(()=>{
        ReflectionApi.deleteReflection(createdReflection.reflectionId!); 

        
    })
    
    it('should create a reflection successfully', async () => {
    
       originalReflectionModel.title = "Example Title"; 
       originalReflectionModel.description = "This is a sample description of the reflection"; 
        
    

       createdReflection = await ReflectionApi.createReflection(
            originalReflectionModel, 
            masterKey
        );

        expect(createdReflection).toBeDefined();
        expect(createdReflection.reflectionId).toBeDefined(); 

    

    });

    it('should decrypt the reflection metadata and return the original data',async()=>{ 

        console.log(createdReflection); 

        const decryptedCollection =  await EncryptionService.decryptCollection(
            masterKey,
            {
                encryptedReflectionKey: EncryptionService.fromBase64(createdReflection.encryptedReflectionKey!), 
                reflectionKeyNonce: EncryptionService.fromBase64(createdReflection.reflectionKeyNonce!), 
                encryptedMetadata: EncryptionService.fromBase64(createdReflection.encryptedMetadata!), 
                metadataNonce:  EncryptionService.fromBase64(createdReflection.metadataNonce!),
            }
         ); 


         expect(decryptedCollection).toBeDefined();     


         expect(decryptedCollection.metadata.title).toEqual(originalReflectionModel.title); 
         expect(decryptedCollection.metadata.description).toEqual(originalReflectionModel.description); 
          

    })  

    let reflectionFromBackend: ReflectionModel; 

    it('should successfully get the reflection from DB', async()=>{
          reflectionFromBackend = await ReflectionApi.getReflection(createdReflection.reflectionId as string);  
          
          expect(reflectionFromBackend).toBeDefined();  
          expect(reflectionFromBackend.reflectionId).toEqual(createdReflection.reflectionId);  
    })  

    it('should have all credentials in the reflection', async()=>{ 
         expect(reflectionFromBackend.encryptedMetadata).not.toBeNull(); 
         expect(reflectionFromBackend.encryptedReflectionKey).not.toBeNull(); 
         expect(reflectionFromBackend.metadataNonce).not.toBeNull();  
         expect(reflectionFromBackend.reflectionKeyNonce).not.toBeNull(); 
    }); 

    it('should encrypt the metadata and modify the title and description via toDecryptedObject method', async()=>{
         const decryptedEncryption = await reflectionFromBackend.toDecryptedModel(masterKey); 
         console.log(decryptedEncryption); 
         expect(decryptedEncryption.reflectionId).toEqual(reflectionFromBackend.reflectionId); 
         expect(decryptedEncryption.title).toEqual(originalReflectionModel.title); 
         expect(decryptedEncryption.description).toEqual(originalReflectionModel.description); 
    })



}); 