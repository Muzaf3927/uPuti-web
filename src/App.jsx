import React, { useEffect } from "react";
import { safeLocalStorage } from "@/lib/localStorage";
import { sessionManager } from "@/lib/sessionManager";
import {
  Login,
  Trips,
  Requests,
  Chats,
  Booking,
  History,
  Profile,
  DeleteAccount,
  DownloadAndroid,
  Orders,
} from "./pages";
import MainLayout from "./layout/MainLayout";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login } from "./app/userSlice/userSlice";
import UserProfile from "./pages/UserProfile";

function App() {
  const { user, isAuth } = useSelector((store) => store.user);
  const dispatch = useDispatch();

  const ErrorElement = () => (
    <div style={{ padding: 16 }}>
      <h2>Unexpected error</h2>
      <p>Something went wrong. Please try again.</p>
    </div>
  );

  const routes = createBrowserRouter([
    {
      path: "/login",
      element: user ? <Navigate to="/" /> : <Login />,
      errorElement: <ErrorElement />,
    },
    {
      path: "/download/android",
      element: <DownloadAndroid />,
      errorElement: <ErrorElement />,
    },
    {
      path: "/delete",
      element: <DeleteAccount />,
      errorElement: <ErrorElement />,
    },
    {
      path: "/",
      element: user ? <MainLayout /> : <Navigate to="/login" />,
      errorElement: <ErrorElement />,
      children: [
        {
          index: true,
          element: <Trips />,
          errorElement: <ErrorElement />,
        },
        {
          path: "/requests",
          element: <Requests />,
          errorElement: <ErrorElement />,
        },
        {
          path: "/booking",
          element: <Booking />,
          errorElement: <ErrorElement />,
        },
        {
          path: "/history",
          element: <History />,
          errorElement: <ErrorElement />,
        },
        {
          path: "/orders",
          element: <Orders />,
          errorElement: <ErrorElement />,
        },
        {
          path: "/chats",
          element: <Chats />,
          errorElement: <ErrorElement />,
        },
        {
          path: "/profile",
          element: <Profile />,
          errorElement: <ErrorElement />,
        },

        {
          path: "/user/:id",
          element: <UserProfile />,
          errorElement: <ErrorElement />,
        },
      ],
    },
  ]);

  useEffect(() => {
    // Проверяем, есть ли активная и валидная сессия
    if (sessionManager.hasActiveSession() && !sessionManager.isSessionExpired()) {
      const userData = sessionManager.getUserData();
      if (userData) {
        dispatch(login(userData));
      } else {
        // Очищаем невалидные данные
        sessionManager.clearSession();
      }
    } else {
      // Если сессия истекла или невалидна, очищаем её
      sessionManager.clearSession();
    }
  }, []);

  return <RouterProvider router={routes} />;
}

export default App;
