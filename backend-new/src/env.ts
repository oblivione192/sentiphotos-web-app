import dotenv from "dotenv";
import path from "path";  

interface EnvObject{
  AWS_REGION: string;
  AWS_BUCKET_NAME: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;   
  FIRESTORE_SERVICE_ACCOUNT_PATH: string;
}   
 
dotenv.config({
  path: path.resolve("C:\\Image Gallery Solo Project\\backend-new\\.env.development"),
});

function required(name: string): string {
  const value = process.env[name];  
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

export const env: EnvObject = {
  AWS_REGION: required("AWS_REGION"),
  AWS_BUCKET_NAME: required("AWS_BUCKET_NAME"),  
  AWS_ACCESS_KEY_ID: required("AWS_ACCESS_KEY_ID"),
  AWS_SECRET_ACCESS_KEY: required("AWS_SECRET_ACCESS_KEY"),
  FIRESTORE_SERVICE_ACCOUNT_PATH: required("FIRESTORE_SERVICE_ACCOUNT_PATH"),
};