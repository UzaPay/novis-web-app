import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  TrendingUp,
  DollarSign
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useLoans,
  useLoanApproval,
  useLoanRejection,
  usePortfolioMetrics
} from '@/hooks/use-api'
import { AnimatedNumber } from '@/components/AnimatedNumber'
import { formatCurrency, formatDate, getStatusColor, cn } from '@/lib/utils'
import { authService } from '@/lib/auth'
import { Loan } from '@/types'

const statuses = [
  { key: 'disbursed', label: 'Disbursed', icon: TrendingUp },
  { key: 'review', label: 'Pending Review', icon: Clock },
  { key: 'processing', label: 'Processing', icon: Clock },
  { key: 'approved', label: 'Approved', icon: CheckCircle },
  { key: 'repaid', label: 'Repaid', icon: CheckCircle },
  { key: 'late', label: 'Late', icon: AlertCircle },
  { key: 'overdue', label: 'Overdue', icon: AlertCircle },
  { key: 'defaulted', label: 'Defaulted', icon: XCircle },
  { key: 'rejected', label: 'Rejected', icon: XCircle },
  { key: 'archived', label: 'Archived', icon: XCircle },
  { key: 'cancelled', label: 'Cancelled', icon: XCircle }
]

type MaybeRecord = Record<string, unknown>

const getCustomerLabel = (
  customer: Loan['customer'] | MaybeRecord | null | undefined
) => {
  if (!customer) return 'Unknown'
  if (typeof customer === 'string') return customer

  const surname = typeof customer.surname === 'string' ? customer.surname : ''
  const otherNames =
    typeof customer.other_names === 'string' ? customer.other_names : ''
  const name = [otherNames, surname].filter(Boolean).join(' ').trim()

  if (name) return name
  if (typeof customer.username === 'string') return customer.username
  if (typeof customer.email === 'string') return customer.email
  if (typeof customer.id_no === 'string') return customer.id_no
  if (typeof customer._id === 'string') return customer._id

  return 'Unknown'
}

const getCustomerId = (
  customer: Loan['customer'] | MaybeRecord | null | undefined
) => {
  if (!customer) return null
  if (typeof customer === 'string') return customer
  if (typeof customer.id === 'string') return customer.id
  if (typeof customer._id === 'string') return customer._id
  return null
}

const getLoanTypeLabel = (
  loanType: Loan['loan_type'] | MaybeRecord | null | undefined
) => {
  if (!loanType) return 'Unknown'
  if (typeof loanType === 'string') return loanType

  if (typeof loanType.loan_name === 'string') return loanType.loan_name
  if (typeof loanType.loan_name === 'string') return loanType.loan_name
  if (typeof loanType._id === 'string') return loanType._id

  return 'Unknown'
}

const formatRate = (rawRate: number | undefined) => {
  const rate = Number(rawRate ?? 0)
  if (!Number.isFinite(rate)) return '0%'
  const normalized = rate <= 1 ? rate * 100 : rate
  const decimals = Number.isInteger(normalized) ? 0 : 2
  return `${normalized.toFixed(decimals)}%`
}

function KPICard ({ title, value, format, icon: Icon, trend }: any) {
  return (
    <Card>
      <CardContent className='p-6'>
        <div className='flex items-center justify-between mb-2'>
          <p className='text-sm font-medium text-muted-foreground'>{title}</p>
          <Icon className='h-4 w-4 text-muted-foreground' />
        </div>
        <div className='space-y-1'>
          <p className='text-2xl font-bold font-numbers'>
            <AnimatedNumber value={value} format={format} />
          </p>
          {trend && <p className='text-xs text-muted-foreground'>{trend}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

export function LoansPage () {
  const [activeStatus, setActiveStatus] = useState('review')
  const [page, setPage] = useState(1)
  const pageSize = 20
  const { mutate: approveLoan, isPending: isApproving } = useLoanApproval()
  const { mutate: rejectLoan, isPending: isRejecting } = useLoanRejection()

  const statusParam = activeStatus === 'all' ? undefined : activeStatus
  const { data: loansResponse, isLoading } = useLoans({
    status: statusParam,
    page,
    limit: pageSize
  })
  const { data: metrics, isLoading: metricsLoading } = usePortfolioMetrics()
  const loans = loansResponse?.docs ?? []

  useEffect(() => {
    setPage(1)
  }, [activeStatus])

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Loan Applications</h1>
        <p className='text-muted-foreground mt-2'>
          Manage and review all loan applications
        </p>
      </div>

      {/* KPIs */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {metricsLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className='h-32' />
            ))}
          </>
        ) : (
          <>
            <KPICard
              title='Total Loans'
              value={metrics?.totalLoans || 0}
              icon={TrendingUp}
            />
            <KPICard
              title='Total Disbursed'
              value={metrics?.totalDisbursed || 0}
              format={formatCurrency}
              icon={DollarSign}
            />
            <KPICard
              title='Outstanding'
              value={metrics?.outstandingBalance || 0}
              format={formatCurrency}
              icon={Clock}
            />
            <KPICard
              title='Repayment Rate'
              value={(metrics?.repaymentRate || 0) * 100}
              format={(v: number) => `${v.toFixed(1)}%`}
              icon={CheckCircle}
            />
          </>
        )}
      </div>

      <Card>
        <CardHeader className='gap-4'>
          <div className='flex flex-wrap items-center justify-between gap-4'>
            <div>
              <CardTitle>Loan List</CardTitle>
              <CardDescription>
                Filter by status and review loan applications.
              </CardDescription>
            </div>
            <div className='flex flex-wrap gap-2'>
              <button
                type='button'
                onClick={() => setActiveStatus('all')}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition',
                  activeStatus === 'all'
                    ? 'bg-foreground text-background border-foreground'
                    : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                All
              </button>
              {statuses.map(({ key, label }) => (
                <button
                  key={key}
                  type='button'
                  onClick={() => setActiveStatus(key)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium border transition',
                    getStatusColor(key),
                    activeStatus === key
                      ? 'ring-2 ring-offset-2 ring-primary/40'
                      : 'opacity-80 hover:opacity-100'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-3'>
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
            </div>
          ) : loans.length > 0 ? (
            <div className='space-y-4'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loan ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Mobile No</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Interest Rate</TableHead>
                    <TableHead>Interest</TableHead>
                    <TableHead>Processing Fee</TableHead>
                    <TableHead>Total Repaid</TableHead>
                    <TableHead>Outstanding</TableHead>
                    <TableHead>Tenor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loans.map((loan: Loan) => {
                    const loanRef = loan._id || loan.id
                    const customerLabel = getCustomerLabel(
                      loan.customer as Loan['customer'] | MaybeRecord
                    )
                    const customerId = getCustomerId(
                      loan.customer as Loan['customer'] | MaybeRecord
                    )
                    const loanTypeLabel = getLoanTypeLabel(
                      loan.loan_type as Loan['loan_type'] | MaybeRecord
                    )
                    const loanActionId = loan._id || loan.id || ''
                    const isReviewable =
                      loan.status === 'review' || loan.status === 'processing'
                    const isApproved = loan.status === 'approved'
                    const isSuperAdmin = authService.isSuperAdmin()

                    return (
                      <TableRow key={loan._id || loan.id}>
                        <TableCell className='font-medium'>
                          <Link
                            to={`/loans/${loanRef}`}
                            className='text-primary hover:underline'
                          >
                            {loan.id}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {customerId ? (
                            <Link
                              to={`/customers/${customerId}`}
                              className='hover:underline'
                            >
                              {customerLabel}
                            </Link>
                          ) : (
                            customerLabel
                          )}
                        </TableCell>
                        <TableCell>{loan.customer.contact.mobile}</TableCell>
                        <TableCell>{loanTypeLabel}</TableCell>
                        <TableCell className='font-numbers'>
                          {formatCurrency(loan.loan_amount)}
                        </TableCell>
                        <TableCell className='text-right'>
                          {formatRate(loan.interest_rate)}
                        </TableCell>
                        <TableCell className='font-numbers'>
                          {formatCurrency(loan.loan_interest)}
                        </TableCell>
                        <TableCell className='font-numbers'>
                          {formatCurrency(
                            // return first loan.fees.fee_amount from the loan.fees array where loan.fees.fee_name==="processing_fee" and calculate the loan.fees.loan_amount based on whether the fee is a percentage or a fixed amount
                            (() => {
                              const processingFee = loan.fees?.find(
                                fee =>
                                  fee.fee_name === 'processing_fee'
                              )
                              if (!processingFee) return 0

                              if (processingFee.fee_name === 'processing_fee' && processingFee.fee_type === 'percentage') {
                                return (
                                  (processingFee.fee_amount / 100) *
                                  loan.loan_amount
                                )
                              } else {
                                return processingFee.fee_amount
                              }
                            })()
                          )}
                        </TableCell>
                        <TableCell className='font-numbers'>
                          {formatCurrency(
                            loan.total_repaid ? loan.total_repaid : 0
                          )}
                        </TableCell>
                        <TableCell className='font-numbers'>
                          {formatCurrency(loan.balance || 0)}
                        </TableCell>
                        <TableCell>{loan.tenure_days} days</TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              'px-2 py-1 rounded-full text-xs font-medium',
                              getStatusColor(loan.status)
                            )}
                          >
                            {loan.status.charAt(0).toUpperCase() +
                              loan.status.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(loan.created_at)}</TableCell>
                        <TableCell className='text-right'>
                          {isSuperAdmin && isReviewable && (
                            <div className='flex items-center justify-end gap-2'>
                              <Button
                                size='sm'
                                onClick={() =>
                                  approveLoan({ loanId: loanActionId })
                                }
                                disabled={
                                  isApproving || isRejecting || !loanActionId
                                }
                              >
                                {isApproving ? 'Approving...' : 'Approve'}
                              </Button>
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() =>
                                  rejectLoan({ loanId: loanActionId })
                                }
                                disabled={
                                  isApproving || isRejecting || !loanActionId
                                }
                              >
                                {isRejecting ? 'Rejecting...' : 'Reject'}
                              </Button>
                            </div>
                          )}
                          {isSuperAdmin && isApproved && (
                            <Button size='sm'>Disburse</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              <div className='flex flex-wrap items-center justify-between gap-3'>
                <p className='text-sm text-muted-foreground'>
                  Showing {loans.length} of{' '}
                  {loansResponse?.totalDocs ?? loans.length} loans
                </p>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    disabled={!loansResponse?.hasPrevPage}
                  >
                    Previous
                  </Button>
                  <span className='text-sm text-muted-foreground'>
                    Page {loansResponse?.page ?? page} of{' '}
                    {loansResponse?.totalPages ?? 1}
                  </span>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setPage(prev => prev + 1)}
                    disabled={!loansResponse?.hasNextPage}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center py-12'>
              <AlertCircle className='h-12 w-12 text-muted-foreground mb-4' />
              <p className='text-lg font-medium'>No loans found</p>
              <p className='text-sm text-muted-foreground'>
                There are no loans with status "{activeStatus}"
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
