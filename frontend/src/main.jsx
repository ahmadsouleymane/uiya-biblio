import { BrowserRouter, Routes, Route } from "react-router-dom"
import { createRoot } from "react-dom/client"
import "./index.css"
import { Toaster } from "react-hot-toast"
import ScrollToTop from "./components/scrolltotop"
import PrivateRoute from "./components/PrivateRoute"
import UserProvider from "./contexts/AuthContext"
import ThemeProvider from "./contexts/ThemeContext"
import BottomNav from "./components/BottomNav"
import OfflineBanner from "./components/OfflineBanner"

import Home from "./pages/home"
import BookPage from "./pages/bookPage"
import Category from "./pages/category"
import Login from "./pages/login"
import SignUp from "./pages/signup"
import Profile from "./pages/profile"

import Admin from "./pages/admin"
import AdminUsers from "./pages/admin/AdminUsers"
import AdminBooks from "./pages/admin/AdminBooks"
import AdminLoans from "./pages/admin/AdminLoans"
import AdminPresence from "./pages/admin/AdminPresence"

import EmployeeDashboard from "./pages/employe/EmployeeDashboard"
import EmployeePresence from "./pages/employe/EmployeePresence"
import EmployeeLoan from "./pages/employe/EmployeeLoan"

import AddBook from "./pages/addBook"
import Activity from "./pages/activity"
import QrPage from "./pages/QrPage"
import ForgotPassword from "./pages/ForgotPassword"
import ResetPassword from "./pages/ResetPassword"
import AdminSettings from "./pages/admin/AdminSettings"
import AdminAudit from "./pages/admin/AdminAudit"
import AdminImport from "./pages/admin/AdminImport"
import AdminCategories from "./pages/admin/AdminCategories"
import NotFound from "./pages/NotFound"

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ThemeProvider>
    <UserProvider>
      <ScrollToTop />
      <Toaster position="top-center" reverseOrder={false} />
      <OfflineBanner />
      <BottomNav />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/book/:id" element={<BookPage />} />
        <Route path="/category/:name" element={<Category />} />
        <Route path="/connexion" element={<Login />} />
        <Route path="/inscription" element={<SignUp />} />
        <Route path="/mot-de-passe-oublie" element={<ForgotPassword />} />
        <Route path="/reinitialiser-mdp/:token" element={<ResetPassword />} />

        {/* QR hors ligne — public (lit localStorage) */}
        <Route path="/mon-qr" element={<QrPage />} />

        {/* Client */}
        <Route path="/profile" element={<PrivateRoute roles={["student","employee","admin"]}><Profile /></PrivateRoute>} />
        <Route path="/activity" element={<PrivateRoute roles={["student","employee","admin"]}><Activity /></PrivateRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<PrivateRoute roles={["admin"]}><Admin /></PrivateRoute>} />
        <Route path="/admin/utilisateurs" element={<PrivateRoute roles={["admin"]}><AdminUsers /></PrivateRoute>} />
        <Route path="/admin/livres" element={<PrivateRoute roles={["admin"]}><AdminBooks /></PrivateRoute>} />
        <Route path="/admin/emprunts" element={<PrivateRoute roles={["admin"]}><AdminLoans /></PrivateRoute>} />
        <Route path="/admin/presence" element={<PrivateRoute roles={["admin"]}><AdminPresence /></PrivateRoute>} />
        <Route path="/admin/parametres" element={<PrivateRoute roles={["admin"]}><AdminSettings /></PrivateRoute>} />
        <Route path="/admin/audit" element={<PrivateRoute roles={["admin"]}><AdminAudit /></PrivateRoute>} />
        <Route path="/admin/import" element={<PrivateRoute roles={["admin"]}><AdminImport /></PrivateRoute>} />
        <Route path="/admin/categories" element={<PrivateRoute roles={["admin"]}><AdminCategories /></PrivateRoute>} />
        <Route path="/add-book" element={<PrivateRoute roles={["admin","employee"]}><AddBook /></PrivateRoute>} />

        {/* Employé */}
        <Route path="/employe" element={<PrivateRoute roles={["employee","admin"]}><EmployeeDashboard /></PrivateRoute>} />
        <Route path="/employe/presence" element={<PrivateRoute roles={["employee","admin"]}><EmployeePresence /></PrivateRoute>} />
        <Route path="/employe/pret" element={<PrivateRoute roles={["employee","admin"]}><EmployeeLoan /></PrivateRoute>} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </UserProvider>
    </ThemeProvider>
  </BrowserRouter>
)
