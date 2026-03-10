import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { useCustomersPaginated } from '@/hooks/use-api'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { motion } from 'framer-motion'
import { ArrowUpDown, Filter, Search, User, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

const joinFilters = [
  { key: 'all', label: 'All' },
  { key: 'last-30', label: 'Joined <30d' },
  { key: 'last-90', label: 'Joined <90d' },
  { key: 'last-365', label: 'Joined <1y' },
  { key: 'over-365', label: '1y+' }
]

const loanFilters = [
  { key: 'all', label: 'All' },
  { key: 'with-loans', label: 'With Loans' },
  { key: 'no-loans', label: 'No Loans' }
]

const creditFilters = [
  { key: 'all', label: 'All' },
  { key: 'with-reports', label: 'With Reports' },
  { key: 'no-reports', label: 'No Reports' }
]

const sortFilters = [
  { key: '-created_at', label: 'Newest' },
  { key: 'created_at', label: 'Oldest' },
  { key: '-points', label: 'Top Points' },
  { key: '-max_loan_limit', label: 'Highest Limit' }
]

const statusFilters = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
  { key: 'suspended', label: 'Suspended' },
  { key: 'archived', label: 'Archived' },
  { key: 'banned', label: 'Banned' }
]

const statusClass = (status?: string) => {
  if (status === 'active')
    return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
  if (status === 'banned')
    return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
  if (status === 'suspended')
    return 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400'
  if (status === 'archived')
    return 'bg-slate-100 text-slate-700 dark:bg-slate-950 dark:text-slate-400'
  if (status === 'inactive')
    return 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400'
  return 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400'
}

export function CustomersPage () {
  const [searchTerm, setSearchTerm] = useState('')
  const [joinFilter, setJoinFilter] = useState('all')
  const [loanFilter, setLoanFilter] = useState('all')
  const [creditFilter, setCreditFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('-created_at')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const hasLoansParam = useMemo(() => {
    if (loanFilter === 'with-loans') return true
    if (loanFilter === 'no-loans') return false
    return undefined
  }, [loanFilter])

  const hasCreditReportsParam = useMemo(() => {
    if (creditFilter === 'with-reports') return true
    if (creditFilter === 'no-reports') return false
    return undefined
  }, [creditFilter])

  const { data: customersResponse, isLoading } = useCustomersPaginated({
    page,
    limit: pageSize,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    search: searchTerm || undefined,
    hasLoans: hasLoansParam,
    hasCreditReports: hasCreditReportsParam,
    joinedRange: joinFilter !== 'all' ? joinFilter : undefined,
    sort: sortBy
  })

  useEffect(() => {
    setPage(1)
  }, [searchTerm, joinFilter, loanFilter, creditFilter, statusFilter, sortBy])

  const customers = customersResponse?.docs ?? []
  const totalDocs = customersResponse?.totalDocs ?? customers.length

  return (
    <div className='space-y-6'>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className='rounded-3xl border bg-gradient-to-br from-background via-background to-muted/40 p-6 shadow-sm'
      >
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div>
            <p className='text-sm text-muted-foreground'>
              Customer Intelligence
            </p>
            <h1 className='text-3xl font-bold tracking-tight'>Customers</h1>
            <p className='text-muted-foreground mt-2'>
              Filter, segment, and monitor customer engagement.
            </p>
          </div>
          <div className='flex items-center gap-3 rounded-2xl border bg-background/80 px-4 py-3'>
            <Users className='h-5 w-5 text-primary' />
            <div>
              <p className='text-xs text-muted-foreground'>Total Customers</p>
              <p className='text-lg font-semibold'>
                {totalDocs.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <Card className='border-muted/60'>
        <CardHeader className='gap-4'>
          <div className='flex flex-wrap items-center justify-between gap-4'>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Filter className='h-4 w-4' />
              Filters
            </div>
            <div className='relative flex-1 max-w-md'>
              <Search className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search by name, ID, or phone...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='pl-9'
              />
            </div>
          </div>

          <div className='space-y-3'>
            <div className='flex flex-wrap items-center gap-2'>
              <span className='text-xs font-medium text-muted-foreground'>
                Joined
              </span>
              {joinFilters.map(filter => (
                <button
                  key={filter.key}
                  type='button'
                  onClick={() => setJoinFilter(filter.key)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium border transition',
                    joinFilter === filter.key
                      ? 'bg-foreground text-background border-foreground'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className='flex flex-wrap items-center gap-2'>
              <span className='text-xs font-medium text-muted-foreground'>
                Loans
              </span>
              {loanFilters.map(filter => (
                <button
                  key={filter.key}
                  type='button'
                  onClick={() => setLoanFilter(filter.key)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium border transition',
                    loanFilter === filter.key
                      ? 'bg-foreground text-background border-foreground'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className='flex flex-wrap items-center gap-2'>
              <span className='text-xs font-medium text-muted-foreground'>
                Credit
              </span>
              {creditFilters.map(filter => (
                <button
                  key={filter.key}
                  type='button'
                  onClick={() => setCreditFilter(filter.key)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium border transition',
                    creditFilter === filter.key
                      ? 'bg-foreground text-background border-foreground'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className='flex flex-wrap items-center gap-2'>
              <span className='text-xs font-medium text-muted-foreground'>
                Status
              </span>
              {statusFilters.map(filter => (
                <button
                  key={filter.key}
                  type='button'
                  onClick={() => setStatusFilter(filter.key)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium border transition',
                    statusFilter === filter.key
                      ? 'bg-foreground text-background border-foreground'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className='flex flex-wrap items-center gap-2'>
              <span className='text-xs font-medium text-muted-foreground'>
                Sort
              </span>
              {sortFilters.map(filter => (
                <button
                  key={filter.key}
                  type='button'
                  onClick={() => setSortBy(filter.key)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium border transition flex items-center gap-1',
                    sortBy === filter.key
                      ? 'bg-foreground text-background border-foreground'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  <ArrowUpDown className='h-3 w-3' />
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-3'>
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
            </div>
          ) : customers.length > 0 ? (
            <div className='space-y-4'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>ID Number</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Total Loans</TableHead>
                    <TableHead>Total Borrowing</TableHead>
                    <TableHead>Disbursed Loans</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer, index) => {
                    const customerRef = customer._id || customer.id
                    return (
                    <motion.tr
                      key={customer._id || customer.id || `${customer.id_no}-${index}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.02 }}
                      className='border-b transition-colors hover:bg-muted/40'
                    >
                      <TableCell className='font-medium'>
                        <div className='flex items-center gap-2'>
                          <div className='h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center'>
                            <User className='h-4 w-4 text-primary' />
                          </div>
                          {customerRef ? (
                            <Link to={`/customers/${customerRef}`} className='text-primary hover:underline'>
                              {customer.surname} {customer.other_names}
                            </Link>
                          ) : (
                            <span>
                              {customer.surname} {customer.other_names}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{customer.id_no ?? '—'}</TableCell>
                      <TableCell>{customer.contact?.mobile ?? '—'}</TableCell>
                      <TableCell className='font-numbers'>
                        {customer.total_outstanding_loans?.all_loans_count || 0}
                      </TableCell>
                      <TableCell className='font-numbers'>
                        {formatCurrency(
                          customer.total_outstanding_loans?.total_borrowing || 0
                        )}
                      </TableCell>
                      <TableCell className='font-numbers'>
                        {customer.total_outstanding_loans?.disbursed_loans_count || 0}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'px-2 py-1 rounded-full text-xs font-medium',
                            statusClass(customer.status)
                          )}
                        >
                          {customer.status || 'unknown'}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(customer.created_at)}</TableCell>
                    </motion.tr>
                    )
                  })}
                </TableBody>
              </Table>

              <div className='flex flex-wrap items-center justify-between gap-3'>
                <p className='text-sm text-muted-foreground'>
                  Showing {customers.length} of {totalDocs} customers
                </p>
                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    className='px-3 py-1.5 rounded-md border text-sm hover:bg-muted disabled:opacity-50'
                    disabled={!customersResponse?.hasPrevPage}
                  >
                    Previous
                  </button>
                  <span className='text-sm text-muted-foreground'>
                    Page {customersResponse?.page ?? page} of{' '}
                    {customersResponse?.totalPages ?? 1}
                  </span>
                  <button
                    type='button'
                    onClick={() => setPage(prev => prev + 1)}
                    className='px-3 py-1.5 rounded-md border text-sm hover:bg-muted disabled:opacity-50'
                    disabled={!customersResponse?.hasNextPage}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center py-12'>
              <User className='h-12 w-12 text-muted-foreground mb-4' />
              <p className='text-lg font-medium'>No customers found</p>
              <p className='text-sm text-muted-foreground'>
                {searchTerm
                  ? 'Try a different search term'
                  : 'No customers in the system'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
