import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import SystemBrandingManager from './components/SystemBrandingManager';
import ConnectivityManager from './components/ConnectivityManager';
// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterSuccess from './pages/RegisterSuccess';
import EmailVerified from './pages/EmailVerified';
import ResendVerification from './pages/ResendVerification';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import VendorDashboard from './pages/VendorDashboard';
import Profile from './pages/Profile';
import KycVerification from './pages/KycVerification';
import Home from './pages/Home';
import DownloadRedirect from './pages/DownloadRedirect';
import PrivacyPolicy from './pages/PrivacyPolicy';
import AboutVendor from './pages/AboutVendor';
import ContactUs from './pages/ContactUs';
import VendorRegister from './pages/VendorRegister';
import Complaints from './pages/Complaints';
import Referrals from './pages/Referrals';

const PrivateRoute = ({ children, allowedRoles }) => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" />;

    if (allowedRoles) {
        const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
        if (!rolesArray.includes(user.role)) {
            // Redirect unauthorized users to their respective home dashboards
            if (user.role === 'admin') return <Navigate to="/admin" />;
            if (user.role === 'vendor') return <Navigate to="/vendor" />;
            return <Navigate to="/dashboard" />;
        }
    }

    return children;
};

const GuestRoute = ({ children }) => {
    const { user } = useAuth();
    if (user) {
        if (user.role === 'admin') return <Navigate to="/admin" />;
        if (user.role === 'vendor') return <Navigate to="/vendor" />;
        return <Navigate to="/dashboard" />;
    }
    return children;
};

import { Toaster } from 'react-hot-toast';

function App() {
    return (
        <Router>
            <SystemBrandingManager />
            <ConnectivityManager />
            <Toaster
                position="top-center"
                reverseOrder={false}
                containerStyle={{ zIndex: 99999 }}
            />
            <ThemeProvider>
                <AuthProvider>
                    <Routes>
                        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
                        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
                        <Route path="/register-success" element={<RegisterSuccess />} />
                        <Route path="/verify-email" element={<EmailVerified />} />
                        <Route path="/resend-verification" element={<ResendVerification />} />
                        <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
                        <Route path="/reset-password" element={<GuestRoute><ResetPassword /></GuestRoute>} />

                        <Route
                            path="/admin"
                            element={
                                <PrivateRoute allowedRoles="admin">
                                    <AdminDashboard />
                                </PrivateRoute>
                            }
                        />

                        <Route
                            path="/vendor"
                            element={
                                <PrivateRoute allowedRoles="vendor">
                                    <VendorDashboard />
                                </PrivateRoute>
                            }
                        />

                        <Route
                            path="/profile"
                            element={
                                <PrivateRoute allowedRoles={['user', 'vendor', 'admin']}>
                                    <Profile />
                                </PrivateRoute>
                            }
                        />

                        <Route
                            path="/kyc"
                            element={
                                <PrivateRoute allowedRoles={['user', 'vendor']}>
                                    <KycVerification />
                                </PrivateRoute>
                            }
                        />

                        <Route
                            path="/dashboard"
                            element={
                                <PrivateRoute allowedRoles="user">
                                    <UserDashboard />
                                </PrivateRoute>
                            }
                        />

                        <Route
                            path="/complaints"
                            element={
                                <PrivateRoute allowedRoles={['user', 'vendor']}>
                                    <Complaints />
                                </PrivateRoute>
                            }
                        />

                        <Route
                            path="/referrals"
                            element={
                                <PrivateRoute allowedRoles="user">
                                    <Referrals />
                                </PrivateRoute>
                            }
                        />

                        <Route path="/download" element={<DownloadRedirect />} />
                        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                        <Route path="/about-vendor" element={<AboutVendor />} />
                        <Route path="/contact-us" element={<ContactUs />} />
                        <Route path="/vendor-register" element={<VendorRegister />} />
                        <Route path="/" element={<Home />} />
                        {/* <Route path="/" element={<Navigate to="/login" replace />} /> */}
                    </Routes>
                </AuthProvider>
            </ThemeProvider>
        </Router>
    );
}

export default App;
