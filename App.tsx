import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardLayout } from '@/components/DashboardLayout'
import { ProtectedRoute } from '@/pages/ProtectedRoute'
import { DashboardPage } from '@/pages/DashboardPage'
import { LoansPage } from '@/pages/LoansPage'
import { CustomersPage } from '@/pages/CustomersPage'
import { LoanTypesPage } from '@/pages/LoanTypesPage'
import { LoanCategoriesPage } from '@/pages/LoanCategoriesPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { LoanDetailPage } from '@/pages/LoanDetailPage'
import { TransactionsPage } from '@/pages/TransactionsPage'
import { CustomerDetailPage } from '@/pages/CustomerDetailPage'
import { authService } from '@/lib/auth'
import { AnalysisPage } from '@/pages/AnalysisPage'

function App () {
  const isAuthenticated = authService.isAuthenticated()
  const isSuperAdmin = authService.isSuperAdmin()

  // only a user who is authenticated and a super admin can access the dashboard, otherwise they should be redirected to the login page.

  return (
    <Routes>
      <Route
        path='/login'
        element={
          isAuthenticated && isSuperAdmin ? <Navigate to='/dashboard' replace /> : <LoginPage />
        }
      />

      <Route
        path='/'
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to='/dashboard' replace />} />
        <Route path='dashboard' element={<DashboardPage />} />
        <Route path='loan-book-analysis' element={<AnalysisPage />} />
        <Route path='loans' element={<LoansPage />} />
        <Route path='loans/:id' element={<LoanDetailPage />} />
        <Route path='customers' element={<CustomersPage />} />
        <Route path='customers/:id' element={<CustomerDetailPage />} />
        <Route path='loan-types' element={<LoanTypesPage />} />
        <Route path='loan-categories' element={<LoanCategoriesPage />} />
        <Route path='transactions' element={<TransactionsPage />} />
        <Route path='reports' element={<ReportsPage />} />
      </Route>

      <Route path='*' element={<Navigate to='/dashboard' replace />} />
    </Routes>
  )
}

export default App
