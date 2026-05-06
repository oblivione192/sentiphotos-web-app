import axios from "axios";  
import AuthenticationApi from "./Objects/Api/AuthenticationApi"; 
import ImageApi from "./Objects/Api/ImageApi"; 
import ReflectionApi from "./Objects/Api/ReflectionApi";  

const apiAxiosClient =  axios.create({ 
   withCredentials: true, 
})  

const authAxiosClient =  axios.create();

AuthenticationApi.init(authAxiosClient);  

ImageApi.init(apiAxiosClient); 
ReflectionApi.init(apiAxiosClient); 