import axios from "axios";

const API = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
});

API.interceptors.request.use((req) => {
    const token = localStorage.getItem("token");
    if(token){
        req.headers.Authorization = `Bearer ${token}` ;
    }
    return req;
});

// Response interceptor to handle token expiration
API.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // Token is expired or invalid
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            
            // Redirect to home page
            window.location.href = "/";
        }
        return Promise.reject(error);
    }
);

export default API;