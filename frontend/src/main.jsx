import { BrowserRouter, Routes, Route } from "react-router-dom"
import { createRoot } from "react-dom/client"
import { lazy, Suspense } from "react"
import "./index.css"
import { Toaster } from "react-hot-toast"
import ScrollToTop from "./components/scrolltotop"
import PrivateRoute from "./components/PrivateRoute"
import UserProvider from "./contexts/AuthContext"
import ThemeProvider from "./contexts/ThemeContext"
import BottomNav from "./components/BottomNav"
import OfflineBanner from "./components/OfflineBanner"

// Home eager (entry point — first paint)
import Home from "./pages/home"

// Everything else lazy
const BookPage = lazy(() => import("./pages/bookPage"))
const Category = lazy(() => import("./pages/category"))
const Login = lazy(() => import("./pages/login"))
const SignUp = lazy(() => import("./pages/signup"))
const Profile = lazy(() => import("./pages/profile"))
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"))
const ResetPassword = lazy(() => import("./pages/ResetPassword"))
const QrPage = lazy(() => import("./pages/QrPage"))
const Activity = lazy(() => import("./pages/activity"))
const AddBook = lazy(() => import("./pages/addBook"))
const EditBook = lazy(() => import("./pages/editBook"))
const NotFound = lazy(() => import("./pages/NotFound"))

const Admin = lazy(() => import("./pages/admin"))
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"))
const AdminBooks = lazy(() => import("./pages/admin/AdminBooks"))
const AdminLoans = lazy(() => import("./pages/admin/AdminLoans"))
const AdminPresence = lazy(() => import("./pages/admin/AdminPresence"))
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"))
const AdminAudit = lazy(() => import("./pages/admin/AdminAudit"))
const AdminImport = lazy(() => import("./pages/admin/AdminImport"))
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"))

const EmployeeDashboard = lazy(() => import("./pages/employe/EmployeeDashboard"))
const EmployeePresence = lazy(() => import("./pages/employe/EmployeePresence"))
const EmployeeLoan = lazy(() => import("./pages/employe/EmployeeLoan"))

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
    <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--muted)", borderTopColor: "transparent" }} />
  </div>
)

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ThemeProvider>
    <UserProvider>
      <ScrollToTop />
      <Toaster position="top-center" reverseOrder={false} />
      <OfflineBanner />
      <BottomNav />
      <Suspense fallback={<RouteFallback />}>
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
        <Route path="/edit-book/:id" element={<PrivateRoute roles={["admin","employee"]}><EditBook /></PrivateRoute>} />

        {/* Employé */}
        <Route path="/employe" element={<PrivateRoute roles={["employee","admin"]}><EmployeeDashboard /></PrivateRoute>} />
        <Route path="/employe/presence" element={<PrivateRoute roles={["employee","admin"]}><EmployeePresence /></PrivateRoute>} />
        <Route path="/employe/pret" element={<PrivateRoute roles={["employee","admin"]}><EmployeeLoan /></PrivateRoute>} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
    </UserProvider>
    </ThemeProvider>
  </BrowserRouter>
)
