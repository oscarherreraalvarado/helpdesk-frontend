import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:5169",
});

// ✅ Request: agrega Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (!token) return config;

  // Axios v1+ usa AxiosHeaders (tiene .set)
  if (config.headers && typeof (config.headers as any).set === "function") {
    (config.headers as any).set("Authorization", `Bearer ${token}`);
  } else {
    // fallback: objeto plano
    config.headers = {
      ...(config.headers as any),
      Authorization: `Bearer ${token}`,
    };
  }

  return config;
});

// ✅ Response: si token expiró o es inválido → limpia sesión y vuelve al login
api.interceptors.response.use(
  (r) => r,
  (error: any) => {
    const status = error?.response?.status;

    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);