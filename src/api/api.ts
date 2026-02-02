import axios from "axios";

export const api = axios.create({
  baseURL: "http://192.168.1.15:3000",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 5000, // tiempo máximo de espera
});

// // Interceptor de errores opcional
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     console.error("API Error:", error);
//     return Promise.reject(error);
//   }
// );
