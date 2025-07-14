import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";

// Auth
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import EmailVerifyPage from "./pages/auth/EmailVerifyPage";
import LogoutPage from "./pages/auth/LogoutPage";
import PasswordEmailPage from "./pages/auth/PasswordEmailPage";
import PasswordResetPage from "./pages/auth/PasswordResetPage";
import PasswordPage from "./pages/auth/PasswordPage";

// Dashboard
import DashboardPage from "./pages/DashboardPage";

// Order
import OrderCreatePage from "./pages/order/OrderCreatePage";
import OrderListPage from "./pages/order/OrderListPage";

// Administrative
import UserListPage from "./pages/admin/user/UserListPage";
import UserCreatePage from "./pages/admin/user/UserCreatePage";

// Profile
import ProfileCreatePage from "./pages/admin/profile/ProfileCreatePage";
import ProfileListPage from "./pages/admin/profile/ProfileListPage";
import ProfileUpdatePage from "./pages/admin/profile/ProfileUpdatePage";

// Item
import ItemListPage from "./pages/item/ItemListPage";
import ItemCreatePage from "./pages/item/ItemCreatePage";
import ItemUpdatePage from "./pages/item/ItemUpdatePage";
import ItemViewPage from "./pages/item/ItemViewPage";

// Establishment
import EstablishmentListPage from "./pages/corp/establishment/EstablishmentListPage";
import EstablishmentCreatePage from "./pages/corp/establishment/EstablishmentCreatePage";
import EstablishmentViewPage from "./pages/establishment/EstablishmentViewPage";
import EstablishmentUpdatePage from "./pages/corp/establishment/EstablishmentUpdatePage";

// User
import UserViewPage from "./pages/user/UserViewPage";
import UserUpdatePage from "./pages/user/UserUpdatePage";

// Appointment
import AppointmentListPage from "./pages/appointment/AppointmentListPage";
import AppointmentCreatePage from "./pages/appointment/AppointmentCreatePage";

// ServiceRecord
import ServiceRecordListPage from "./pages/serviceRecord/ServiceRecordListPage";
import ServiceRecordCreatePage from "./pages/serviceRecord/ServiceRecordCreatePage";
import ServiceRecordViewPage from "./pages/serviceRecord/ServiceRecordViewPage";

import ProcessingIndicatorComponent from "./components/ProcessingIndicatorComponent";
import { apiBaseUrl } from "./config";

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const headers = { Authorization: `Bearer ${token}` };
          const response = await axios.get(`${apiBaseUrl}/auth/me`, { headers });
          setUser(response.data.user);
        } catch {
          setUser(null);
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <ProcessingIndicatorComponent
        messages={["Carregando...", "Quase pronto, por favor aguarde..."]}
        interval={500}
      />
    );
  }

  const protectedRoute = (element) =>
    user ? (user.email_verified_at ? element : <Navigate to="/email-verify" />) : <Navigate to="/login" />;
  const emailVerifiedRoute = (element) =>
    user ? (!user.email_verified_at ? element : <Navigate to="/dashboard" />) : <Navigate to="/login" />;
  const restrictedRoute = (element) => (user ? <Navigate to="/dashboard" /> : element);

  return (
    <Router>
      <Routes>
        {/* Public / Restricted */}
        <Route path="/register" element={restrictedRoute(<RegisterPage />)} />
        <Route path="/login" element={restrictedRoute(<LoginPage />)} />
        <Route path="/password-email" element={restrictedRoute(<PasswordEmailPage />)} />
        <Route path="/password-reset" element={restrictedRoute(<PasswordResetPage />)} />
        <Route path="/email-verify" element={emailVerifiedRoute(<EmailVerifyPage />)} />
        <Route path="/password" element={protectedRoute(<PasswordPage />)} />
        <Route path="/logout" element={<LogoutPage />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={protectedRoute(<DashboardPage />)} />
        <Route path="/order/list/:entityId" element={protectedRoute(<OrderListPage />)}/>

        {/* Order Creation */}
       <Route  path="/order/create/:entityId"  element={protectedRoute(<OrderCreatePage />)}/>

        {/* User */}
        <Route path="/user/update" element={protectedRoute(<UserUpdatePage />)} />
        <Route path="/user/list" element={protectedRoute(<UserListPage />)} />
        <Route path="/user/create" element={protectedRoute(<UserCreatePage />)} />
        <Route path="/user/:userName" element={protectedRoute(<UserViewPage />)} />

        {/* Profile */}
        <Route path="/profile/create" element={protectedRoute(<ProfileCreatePage />)} />
        <Route path="/profile/list" element={protectedRoute(<ProfileListPage />)} />
        <Route path="/profile/update/:id" element={protectedRoute(<ProfileUpdatePage />)} />

        {/* Item */}
        <Route path="/item/list/:slug" element={protectedRoute(<ItemListPage />)} />
        <Route path="/item/create/:slug" element={protectedRoute(<ItemCreatePage />)} />
        <Route path="/item/update/:id" element={protectedRoute(<ItemUpdatePage />)} />
        <Route path="/item/:id" element={protectedRoute(<ItemViewPage />)} />

        {/* Establishment */}
        <Route path="/establishment" element={protectedRoute(<EstablishmentListPage />)} />
        <Route path="/establishment/create" element={protectedRoute(<EstablishmentCreatePage />)} />
        <Route path="/establishment/view/:slug" element={protectedRoute(<EstablishmentViewPage />)} />
        <Route path="/establishment/update/:id" element={protectedRoute(<EstablishmentUpdatePage />)} />

        {/* Appointments */}
        <Route path="/appointment/create/:slug" element={protectedRoute(<AppointmentCreatePage />)} />
        <Route path="/appointment/my" element={protectedRoute(<AppointmentListPage />)} />
        <Route path="/appointment/barbershop/:slug" element={protectedRoute(<AppointmentListPage />)} />
        <Route path="/appointment/barber/:username" element={protectedRoute(<AppointmentListPage />)} />

        {/* Service Records */}
        <Route path="/service-record/create/:slug" element={protectedRoute(<ServiceRecordCreatePage />)} />
        <Route path="/service-record/my" element={protectedRoute(<ServiceRecordListPage />)} />
        <Route path="/service-record/barbershop/:slug" element={protectedRoute(<ServiceRecordListPage />)} />
        <Route path="/service-record/barber/:username" element={protectedRoute(<ServiceRecordListPage />)} />
        <Route path="/service-record/view/:id" element={protectedRoute(<ServiceRecordViewPage />)} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default App;