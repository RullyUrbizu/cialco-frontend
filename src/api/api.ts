import axios from "axios";

const getBaseUrl = () => {
  // Si existe la variable de entorno, la usamos (prioridad para producción o overrides)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // En desarrollo, asumimos que el backend corre en el mismo host pero puerto 3000
  // Esto funciona tanto para localhost como para acceso por IP (ej: 192.168.1.X)
  return `http://${window.location.hostname}:3000`;
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 5000,
});

// // Interceptor de errores opcional
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     console.error("API Error:", error);
//     return Promise.reject(error);
//   }
// );
