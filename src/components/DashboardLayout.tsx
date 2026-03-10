import { Outlet, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  FileText,
  Tag,
  FolderOpen,
  BarChart3,
  ReceiptText,
  LogOut,
  Menu,
  Coins,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { authService } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { BrandLogo } from '@/components/BrandLogo'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Loan Book Analysis', href: '/loan-book-analysis', icon: Coins },
  { name: 'Loans', href: '/loans', icon: FileText },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Loan Types', href: '/loan-types', icon: Tag },
  { name: 'Loan Categories', href: '/loan-categories', icon: FolderOpen },
  { name: 'Transactions', href: '/transactions', icon: ReceiptText },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
]

export function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const user = authService.getUser()

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: 0 }}
        animate={{ x: isSidebarOpen ? 0 : -280 }}
        transition={{ duration: 0.3 }}
        className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card"
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b px-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center"
            >
              <BrandLogo
                logoClassName="h-8"
                textClassName="text-lg font-semibold text-slate-900"
              />
            </motion.div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </NavLink>
              </motion.div>
            ))}
          </nav>

          {/* User info and logout */}
          <div className="border-t p-4">
            <div className="mb-3 rounded-lg bg-muted/50 p-3">
              <p className="text-sm font-medium">{user?.full_name}</p>
              <p className="text-xs text-muted-foreground">{user?.role}</p>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => authService.logout()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <div
        className={cn(
          'transition-all duration-300',
          isSidebarOpen ? 'pl-64' : 'pl-0'
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? (
              <Menu className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
          
          <div className="flex-1" />
          
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
