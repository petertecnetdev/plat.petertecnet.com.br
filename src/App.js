// src/App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";

import HomePage from "./pages/HomePage";
import PublicRestaurantsPage from "./pages/public/PublicRestaurantsPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import EmailVerifyPage from "./pages/auth/EmailVerifyPage";
import LogoutPage from "./pages/auth/LogoutPage";
import PasswordEmailPage from "./pages/auth/PasswordEmailPage";
import PasswordResetPage from "./pages/auth/PasswordResetPage";
import PasswordPage from "./pages/auth/PasswordPage";
import InviteCompletePage from "./pages/auth/InviteCompletePage";
import DashboardPage from "./pages/DashboardPage";
import OrderCreatePage from "./pages/order/OrderCreatePage";
import OrderListPage from "./pages/order/OrderListPage";
import OrderEditPage from "./pages/order/OrderEditPage";
import UserListPage from "./pages/admin/user/UserListPage";
import UserCreatePage from "./pages/admin/user/UserCreatePage";
import UserViewPage from "./pages/user/UserViewPage";
import UserUpdatePage from "./pages/user/UserUpdatePage";
import ProfileCreatePage from "./pages/admin/profile/ProfileCreatePage";
import ProfileListPage from "./pages/admin/profile/ProfileListPage";
import ProfileUpdatePage from "./pages/admin/profile/ProfileUpdatePage";
import ItemListPage from "./pages/item/ItemListPage";
import ItemCreatePage from "./pages/item/ItemCreatePage";
import ItemUpdatePage from "./pages/item/ItemUpdatePage";
import ItemViewPage from "./pages/item/ItemViewPage";
import EstablishmentListPage from "./pages/corp/establishment/EstablishmentListPage";
import EstablishmentCreatePage from "./pages/establishment/EstablishmentCreatePage";
import EstablishmentViewPage from "./pages/establishment/EstablishmentViewPage";
import EstablishmentUpdatePage from "./pages/establishment/EstablishmentUpdatePage";
import ServiceRecordListPage from "./pages/serviceRecord/ServiceRecordListPage";
import ServiceRecordViewPage from "./pages/serviceRecord/ServiceRecordViewPage";
import ReportOrderPage from "./pages/report/ReportOrderPage";
import ProcessingIndicatorComponent from "./components/ProcessingIndicatorComponent";
import { apiV1BaseUrl } from "./config";
import "./index.css";

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        if (active) setLoading(false);
        return;
      }

      try {
        const { data } = await axios.get(`${apiV1BaseUrl}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const context = data?.data || data || {};
        if (active) setUser(context.user || null);
      } catch (error) {
        console.error("[Plat] Falha ao inicializar sessão", error);
        if (error?.response?.status === 401) {
          localStorage.removeItem("token");
        }
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <ProcessingIndicatorComponent
        messages={["Carregando a Plat…", "Preparando sua experiência…"]}
        interval={2200}
      />
    );
  }

  const protectedRoute = (element) =>
    user
      ? user.email_verified_at
        ? element
        : <Navigate to="/email-verify" replace />
      : <Navigate to="/login" replace />;

  const emailVerifiedRoute = (element) =>
    user
      ? !user.email_verified_at
        ? element
        : <Navigate to="/dashboard" replace />
      : <Navigate to="/login" replace />;

  const restrictedRoute = (element) => user ? <Navigate to="/dashboard" replace /> : element;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/restaurants" element={<PublicRestaurantsPage />} />
        <Route path="/establishment/view/:slug" element={<EstablishmentViewPage />} />
        <Route path="/register" element={restrictedRoute(<RegisterPage />)} />
        <Route path="/login" element={restrictedRoute(<LoginPage />)} />
        <Route path="/password-email" element={restrictedRoute(<PasswordEmailPage />)} />
        <Route path="/password-reset" element={restrictedRoute(<PasswordResetPage />)} />
        <Route path="/email-verify" element={emailVerifiedRoute(<EmailVerifyPage />)} />
        <Route path="/password" element={protectedRoute(<PasswordPage />)} />
        <Route path="/invite-complete" element={restrictedRoute(<InviteCompletePage />)} />
        <Route path="/logout" element={<LogoutPage />} />
        <Route path="/dashboard" element={protectedRoute(<DashboardPage />)} />
        <Route path="/order/list/:entityId" element={protectedRoute(<OrderListPage />)} />
        <Route path="/order/create/:entityId" element={protectedRoute(<OrderCreatePage />)} />
        <Route path="/order/edit/:entityId/:id" element={protectedRoute(<OrderEditPage />)} />
        <Route path="/user/update" element={protectedRoute(<UserUpdatePage />)} />
        <Route path="/user/list" element={protectedRoute(<UserListPage />)} />
        <Route path="/user/create" element={protectedRoute(<UserCreatePage />)} />
        <Route path="/user/:userName" element={protectedRoute(<UserViewPage />)} />
        <Route path="/profile/create" element={protectedRoute(<ProfileCreatePage />)} />
        <Route path="/profile/list" element={protectedRoute(<ProfileListPage />)} />
        <Route path="/profile/update/:id" element={protectedRoute(<ProfileUpdatePage />)} />
        <Route path="/item/list/:slug" element={protectedRoute(<ItemListPage />)} />
        <Route path="/item/create/:slug" element={protectedRoute(<ItemCreatePage />)} />
        <Route path="/item/update/:id" element={protectedRoute(<ItemUpdatePage />)} />
        <Route path="/item/view/:slug" element={protectedRoute(<ItemViewPage />)} />
        <Route path="/establishment" element={protectedRoute(<EstablishmentListPage />)} />
        <Route path="/establishment/create" element={protectedRoute(<EstablishmentCreatePage />)} />
        <Route path="/establishment/update/:id" element={protectedRoute(<EstablishmentUpdatePage />)} />
        <Route path="/service-record/my" element={protectedRoute(<ServiceRecordListPage />)} />
        <Route path="/service-record/view/:id" element={protectedRoute(<ServiceRecordViewPage />)} />
        <Route path="/report/order/:entityId" element={protectedRoute(<ReportOrderPage />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
