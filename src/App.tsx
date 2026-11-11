import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { RedirectIfAuthenticated, RequireAdmin, RequireAuth } from './auth/guards'
import { AppShell } from './components/AppShell'
import { AdminClassesPage } from './pages/AdminClassesPage'
import { AdminStudentsPage } from './pages/AdminStudentsPage'
import { ClassesPage } from './pages/ClassesPage'
import { LoginPage } from './pages/LoginPage'
import { MyHoldsPage } from './pages/MyHoldsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { RegisterPage } from './pages/RegisterPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<AppShell />}>
            {/* Signed-out only. */}
            <Route element={<RedirectIfAuthenticated />}>
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
            </Route>

            {/* Requires the SAMS.Auth cookie. */}
            <Route element={<RequireAuth />}>
              <Route index element={<Navigate to="/classes" replace />} />
              <Route path="classes" element={<ClassesPage />} />
              <Route path="my-holds" element={<MyHoldsPage />} />

              {/* Additionally requires RoleName == "Admin". */}
              <Route element={<RequireAdmin />}>
                <Route path="admin" element={<Navigate to="/admin/classes" replace />} />
                <Route path="admin/classes" element={<AdminClassesPage />} />
                <Route path="admin/students" element={<AdminStudentsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
