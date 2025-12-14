import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { safeLocalStorage } from "@/lib/localStorage";

const { VITE_API_BASE } = import.meta.env;

// Локальный API для тестирования
const LOCAL_API_BASE = "http://localhost:8000/api";
// const PRODUCTION_API_BASE = "https://api.uputi.net/api";

// Используем локальный API для тестирования
const api = axios.create({
  // baseURL: VITE_API_BASE || PRODUCTION_API_BASE, // Основной API (закомментирован)
  baseURL: LOCAL_API_BASE, // Локальный API для теста
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

api.interceptors.request.use(
  (config) => {
    const token = safeLocalStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const refreshAccessToken = async () => {
  const refreshToken = safeLocalStorage.getItem("reFreshToken");
  if (!refreshToken) throw new Error("No refresh token available");

  // Используем локальный API для тестирования
  // const API_BASE = VITE_API_BASE || PRODUCTION_API_BASE; // Основной API (закомментирован)
  const API_BASE = LOCAL_API_BASE; // Локальный API для теста
  
  const { data } = await axios.post(
    `${API_BASE}/refresh-token`,
    { refresh_token: refreshToken }
  );

  safeLocalStorage.setItem("token", data.access_token);
  api.defaults.headers.common["Authorization"] = `Bearer ${data.access_token}`;
};

// Set up automatic refresh every 2 hours and 1 minute
// setInterval(refreshAccessToken, (2 * 60 + 1) * 60 * 1000); // 2 hours and 1 minute

const isAuthPath = (url = "") => {
  try {
    // url can be relative like "/login" or absolute
    return [
      "/login",
      "/register",
      "/verify",
      "/auth/start",
      "/auth/verify",
      "/reset-password/step-one",
      "/reset-password/step-two",
      "/delete-account/by-credentials",
      "/account/delete/send-otp",
      "/account/delete/verify",
    ].some((p) => url.includes(p));
  } catch {
    return false;
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error("API Error:", error);

    // Handle CORS and network errors
    if (!error.response) {
      console.error("Network error or CORS issue:", error.message);
      return Promise.reject(
        new Error(
          "Network error. Please check your connection or try again later."
        )
      );
    }

    const originalRequest = error.config || {};
    const status = error.response?.status;
    const errorMessage = error.response?.data?.message;

    if (status === 401) {
      // Если сообщение "Unauthenticated.", сразу перенаправляем на логин
      if (errorMessage === "Unauthenticated.") {
        // Очищаем токены
        safeLocalStorage.removeItem("token");
        safeLocalStorage.removeItem("reFreshToken");
        safeLocalStorage.removeItem("user");
        
        // Перенаправляем на логин, если не на странице логина
        if (typeof window !== "undefined" && window.location?.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      // Do not attempt refresh on auth endpoints
      if (isAuthPath(originalRequest.url)) {
        return Promise.reject(error);
      }

      // Require refresh token to try refresh
      const hasRefresh = !!safeLocalStorage.getItem("reFreshToken");
      if (!hasRefresh) {
        // Нет refresh token, очищаем и перенаправляем
        safeLocalStorage.removeItem("token");
        safeLocalStorage.removeItem("reFreshToken");
        safeLocalStorage.removeItem("user");
        if (typeof window !== "undefined" && window.location?.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      if (!originalRequest._retry) {
        originalRequest._retry = true;
        try {
          await refreshAccessToken();
          return api(originalRequest);
        } catch (refreshErr) {
          // Clear tokens and optionally redirect if not on login page
          safeLocalStorage.removeItem("token");
          safeLocalStorage.removeItem("reFreshToken");
          safeLocalStorage.removeItem("user");
          try {
            if (typeof window !== "undefined" && window.location?.pathname !== "/login") {
              window.location.href = "/login";
            }
          } catch {}
          return Promise.reject(refreshErr);
        }
      }
    }
    return Promise.reject(error);
  }
);

export const getData = async (url) => {
  const { data } = await api.get(url);
  return data;
};

export const postData = async (url, body) => {
  try {
    const { data } = await api.post(url, body);
    return data;
  } catch (error) {
    throw error;
  }
};

export const deleteData = async (url) => {
  const { data } = await api.delete(url);
  return data;
};

// Example usage with TanStack Query
export const useGetData = (url) => {
  return useQuery({ 
    queryKey: ["data", url], 
    queryFn: () => getData(url),
    enabled: !!url, // Запрос выполняется только если url не null/undefined/пустая строка
  });
};

export const usePostData = (url) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => postData(url, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data", url] });
    },
  });
};

export const useDeleteData = (url) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteData(url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data", url] });
    },
  });
};

// User account management API helpers
export const userApi = {
  deleteAccount: () => deleteData("/user/delete-account"),
  deleteAccountByCredentials: (credentials) => postData("/delete-account/by-credentials", credentials),
  sendDeleteOtp: (phone) => postData("/account/delete/send-otp", { phone }),
  verifyDeleteOtp: (data) => postData("/account/delete/verify", data),
  updateProfile: (data) => postData("/user", data),
  updateRole: (data) => postData("/role/update", data),
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => userApi.deleteAccount(),
    onSuccess: () => {
      // Clear all cached data and tokens
      queryClient.clear();
      safeLocalStorage.removeItem("token");
      safeLocalStorage.removeItem("reFreshToken");
      safeLocalStorage.removeItem("user");
      // Redirect to login page
      window.location.href = "/login";
    },
  });
};

export const useDeleteAccountByCredentials = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentials) => userApi.deleteAccountByCredentials(credentials),
    onSuccess: () => {
      // Clear all cached data and tokens
      queryClient.clear();
      safeLocalStorage.removeItem("token");
      safeLocalStorage.removeItem("reFreshToken");
      safeLocalStorage.removeItem("user");
      // Redirect to login page
      window.location.href = "/login";
    },
  });
};

export const useSendDeleteOtp = () => {
  return useMutation({
    mutationFn: (phone) => userApi.sendDeleteOtp(phone),
  });
};

export const useVerifyDeleteOtp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => userApi.verifyDeleteOtp(data),
    onSuccess: () => {
      // Clear all cached data and tokens
      queryClient.clear();
      safeLocalStorage.removeItem("token");
      safeLocalStorage.removeItem("reFreshToken");
      safeLocalStorage.removeItem("user");
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => userApi.updateProfile(data),
    onSuccess: () => {
      // Invalidate user data queries to refresh the profile
      queryClient.invalidateQueries({ queryKey: ["data", "/users/me"] });
      queryClient.invalidateQueries({ queryKey: ["data", "/user"] });
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => {
      console.log("useUpdateRole: Calling API with data:", data);
      return userApi.updateRole(data);
    },
    onSuccess: (response, variables) => {
      console.log("useUpdateRole: Success response:", response);
      console.log("useUpdateRole: Variables (role):", variables);
      // Invalidate user data queries to refresh the profile with new role
      queryClient.invalidateQueries({ queryKey: ["data", "/users/me"] });
      queryClient.invalidateQueries({ queryKey: ["data", "/user"] });
      // Also update user in localStorage
      const userData = safeLocalStorage.getItem("user");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          user.role = variables.role;
          safeLocalStorage.setItem("user", JSON.stringify(user));
          console.log("useUpdateRole: Updated localStorage with role:", variables.role);
        } catch (error) {
          console.error("Error updating user role in localStorage:", error);
        }
      }
    },
    onError: (error) => {
      console.error("useUpdateRole: Error updating role:", error);
      console.error("useUpdateRole: Error response:", error.response);
    },
  });
};

// Chat API удален

// Booking unread count API helpers
export const bookingsApi = {
  getUnreadCount: () => getData("/bookings/unread-count"),
};

export const useBookingsUnreadCount = () =>
  useQuery({ 
    queryKey: ["bookings", "unread-count"], 
    queryFn: bookingsApi.getUnreadCount, 
    refetchInterval: 60000,
    staleTime: 30000, // Данные считаются свежими 30 секунд
    cacheTime: 300000 // Кэш хранится 5 минут
  });

// Download count tracking API
export const downloadCountApi = {
  trackDownload: (type) => postData("/count/download", { type }),
};

export const useTrackDownloadCount = () => {
  return useMutation({
    mutationFn: (type) => downloadCountApi.trackDownload(type),
    onError: (error) => {
      // Не показываем ошибку пользователю, просто логируем
      console.error("Failed to track download count:", error);
    },
  });
};

// Telegram connect API
export const telegramApi = {
  connect: () => getData("/telegram/connect"),
};

export const useTelegramConnect = () => {
  return useMutation({
    mutationFn: () => telegramApi.connect(),
  });
};

// ? HOW TO USE EXAMPLES:

// * 1. GET DATA (useGetData hook)
// const { data, isLoading, error, refetch } = useGetData("/trips");
// if (isLoading) return <div>Loading...</div>;
// if (error) return <div>Error: {error.message}</div>;
// return <div>{data?.map(trip => <div key={trip.id}>{trip.from} to {trip.to}</div>)}</div>;

// * 2. POST DATA (usePostData hook)
// const createTrip = usePostData("/trips");
// const handleSubmit = async (formData) => {
//   try {
//     const result = await createTrip.mutateAsync(formData);
//     console.log("Trip created:", result);
//   } catch (error) {
//     console.error("Failed to create trip:", error);
//   }
// };
// <button onClick={() => handleSubmit({from: "Tashkent", to: "Samarkand"})} disabled={createTrip.isPending}>
//   {createTrip.isPending ? "Creating..." : "Create Trip"}
// </button>

// * 3. DELETE DATA (useDeleteData hook)
// const deleteTrip = useDeleteData("/trips");
// const handleDelete = async (tripId) => {
//   try {
//     await deleteTrip.mutateAsync();
//     console.log("Trip deleted successfully");
//   } catch (error) {
//     console.error("Failed to delete trip:", error);
//   }
// };
// <button onClick={() => handleDelete(123)} disabled={deleteTrip.isPending}>
//   {deleteTrip.isPending ? "Deleting..." : "Delete Trip"}
// </button>

// * 4. LOGIN EXAMPLE (using usePostData)
// const loginMutation = usePostData("/login");
// const handleLogin = async (credentials) => {
//   try {
//     const response = await loginMutation.mutateAsync(credentials);
//     localStorage.setItem("token", response.access_token);
//     localStorage.setItem("user", JSON.stringify(response.user));
//   } catch (error) {
//     console.error("Login failed:", error);
//   }
// };
// <form onSubmit={(e) => { e.preventDefault(); handleLogin({phone: "998901234567", password: "123456"}); }}>
//   {loginMutation.error && <div>Login failed: {loginMutation.error.message}</div>}
//   <button type="submit" disabled={loginMutation.isPending}>
//     {loginMutation.isPending ? "Logging in..." : "Login"}
//   </button>
// </form>

// * 5. FETCH USER PROFILE (using useGetData)
// const { data: user, isLoading: userLoading, error: userError } = useGetData("/user/profile");
// if (userLoading) return <div>Loading profile...</div>;
// if (userError) return <div>Error loading profile</div>;
// return <div>Welcome, {user?.name}!</div>;

// * 6. UPDATE TRIP STATUS (using usePostData)
// const updateTripStatus = usePostData("/trips/update-status");
// const handleStatusUpdate = async (tripId, newStatus) => {
//   try {
//     await updateTripStatus.mutateAsync({ tripId, status: newStatus });
//     console.log("Status updated successfully");
//   } catch (error) {
//     console.error("Failed to update status:", error);
//   }
// };
// <button onClick={() => handleStatusUpdate(123, "completed")} disabled={updateTripStatus.isPending}>
//   Mark as Completed
// </button>
