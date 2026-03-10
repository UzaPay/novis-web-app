import BackButton from '@/components/ui/back-button'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useCustomer,
  useLoan,
  useLoanActivities,
  useLoanApproval,
  useLoanCancellation,
  useLoanDisbursement,
  useLoanRejection
} from '@/hooks/use-api'
import {
  cn,
  formatCurrency,
  formatDate,
  formatDateTime,
  getStatusColor
} from '@/lib/utils'
import { ActivityLog, Customer, Loan } from '@/types'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BadgeCheck,
  Ban,
  CheckCircle2,
  Circle,
  Clock3,
  Phone,
  User,
  XCircle
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

const getCustomerName = (borrower?: Customer | null) => {
  if (!borrower) return 'Unknown borrower'
  const name = `${borrower.other_names ?? ''} ${borrower.surname ?? ''}`.trim()
  if (name) return name
  if (borrower.username) return borrower.username
  return borrower.id_no || 'Unknown borrower'
}

const getRateLabel = (rawRate?: number) => {
  const value = Number(rawRate ?? 0)
  if (!Number.isFinite(value)) return '0%'
  const normalized = value <= 1 ? value * 100 : value
  const decimals = Number.isInteger(normalized) ? 0 : 2
  return `${normalized.toFixed(decimals)}%`
}

type TimelineItem = {
  id: string
  title: string
  description: string
  timestamp: string
  tone: 'default' | 'success' | 'warning' | 'danger'
}

const buildFallbackTimeline = (loan: Loan): TimelineItem[] => {
  const rows: TimelineItem[] = [
    {
      id: `loan-created-${loan._id}`,
      title: 'Loan application created',
      description: `Application ${loan.id ?? loan._id} submitted for review.`,
      timestamp: loan.created_at,
      tone: 'default'
    }
  ]

  if (loan.status === 'approved') {
    rows.push({
      id: `loan-approved-${loan._id}`,
      title: 'Loan approved',
      description: 'Application approved and ready for disbursement.',
      timestamp: loan.modified_at,
      tone: 'success'
    })
  }

  if (loan.status === 'disbursed') {
    rows.push({
      id: `loan-disbursed-${loan._id}`,
      title: 'Loan disbursed',
      description: 'Funds have been disbursed to the borrower.',
      timestamp: loan.modified_at,
      tone: 'success'
    })
  }

  if (loan.status === 'rejected' || loan.status === 'cancelled') {
    rows.push({
      id: `loan-closed-${loan._id}`,
      title: loan.status === 'rejected' ? 'Loan rejected' : 'Loan cancelled',
      description:
        loan.status === 'rejected'
          ? 'Application was rejected during review.'
          : 'Application was cancelled before completion.',
      timestamp: loan.modified_at,
      tone: 'danger'
    })
  }

  return rows
}

const mapActivitiesToTimeline = (
  activities: ActivityLog[],
  loan: Loan
): TimelineItem[] => {
  if (!activities || activities.length === 0) {
    return buildFallbackTimeline(loan)
  }

  const mapped = activities.map((item, index) => {
    const type = item.activity_type ?? ''
    const tone: TimelineItem['tone'] =
      type.includes('REJECT') || type.includes('DEFAULT')
        ? 'danger'
        : type.includes('APPROVED') ||
          type.includes('DISBURSED') ||
          type.includes('REPAID')
        ? 'success'
        : type.includes('LATE') || type.includes('OVERDUE')
        ? 'warning'
        : 'default'

    return {
      id: item._id || `${loan._id}-${index}`,
      title: item.activity_name || type || 'Activity',
      description: item.description || item.message || 'No details provided.',
      timestamp: item.created_at,
      tone
    }
  })

  return mapped.sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp))
}

function BorrowerFlyout ({
  borrower,
  open,
  onClose
}: {
  borrower: Customer | null | undefined
  open: boolean
  onClose: () => void
}) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type='button'
            aria-label='Close borrower profile'
            className='fixed inset-0 z-40 bg-black/40'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.2 }}
            className='fixed right-0 top-0 z-50 h-screen w-full max-w-lg border-l bg-background p-6 overflow-y-auto'
          >
            <div className='mb-6 flex items-center justify-between'>
              <h3 className='text-xl font-semibold'>Borrower Profile</h3>
              <Button variant='outline' size='sm' onClick={onClose}>
                Close
              </Button>
            </div>

            {!borrower ? (
              <p className='text-sm text-muted-foreground'>
                Borrower profile not available.
              </p>
            ) : (
              <div className='space-y-6'>
                <Card>
                  <CardHeader>
                    <CardTitle>{getCustomerName(borrower)}</CardTitle>
                    <CardDescription>{borrower.role}</CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-2 text-sm'>
                    <p>
                      <span className='font-medium'>User ID:</span>{' '}
                      {borrower.id ?? borrower._id}
                    </p>
                    <p>
                      <span className='font-medium'>National ID:</span>{' '}
                      {borrower.id_no || '—'}
                    </p>
                    <p>
                      <span className='font-medium'>Phone:</span>{' '}
                      {borrower.contact?.mobile || '—'}
                    </p>
                    <p>
                      <span className='font-medium'>Email:</span>{' '}
                      {borrower.contact?.email || borrower.email || '—'}
                    </p>
                    <p>
                      <span className='font-medium'>Status:</span>{' '}
                      {borrower.status}
                    </p>
                    <p>
                      <span className='font-medium'>Loan Status:</span>{' '}
                      {borrower.loan_status || '—'}
                    </p>
                    <p>
                      <span className='font-medium'>Joined:</span>{' '}
                      {formatDate(borrower.created_at)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className='text-base'>
                      Financial Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-2 text-sm'>
                    <p>
                      <span className='font-medium'>Available Loan Limit:</span>{' '}
                      {formatCurrency(
                        Number(borrower.available_loan_limit ?? 0)
                      )}
                    </p>
                    <p>
                      <span className='font-medium'>Max Loan Limit:</span>{' '}
                      {formatCurrency(Number(borrower.max_loan_limit ?? 0))}
                    </p>
                    <p>
                      <span className='font-medium'>Monthly Income:</span>{' '}
                      {formatCurrency(Number(borrower.monthly_income ?? 0))}
                    </p>
                    <p>
                      <span className='font-medium'>Income Source:</span>{' '}
                      {borrower.income_source || '—'}
                    </p>
                    <p>
                      <span className='font-medium'>Risk Flags:</span>{' '}
                      {(borrower.risk_flags ?? []).join(', ') || '—'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  )
}

export function LoanDetailPage () {
  const { id = '' } = useParams()
  const [profileOpen, setProfileOpen] = useState(false)

  const { data: loan, isLoading } = useLoan(id)
  const loanRef = loan?._id || loan?.id || id
  const customerId =
    loan && typeof loan.customer === 'string'
      ? loan.customer
      : loan && loan.customer && typeof loan.customer === 'object'
      ? (loan.customer as Customer)._id || (loan.customer as Customer).id || ''
      : ''

  const { data: borrowerFromApi } = useCustomer(customerId)
  const borrower =
    loan && loan.customer && typeof loan.customer === 'object'
      ? (loan.customer as Customer)
      : borrowerFromApi

  const { data: activities } = useLoanActivities(loanRef, loan)

  const { mutate: approveLoan, isPending: isApproving } = useLoanApproval()
  const { mutate: rejectLoan, isPending: isRejecting } = useLoanRejection()
  const { mutate: cancelLoan, isPending: isCancelling } = useLoanCancellation()
  const { mutate: disburseLoan, isPending: isDisbursing } =
    useLoanDisbursement()

  const timelineItems = useMemo(() => {
    if (!loan) return []
    return mapActivitiesToTimeline(activities ?? [], loan)
  }, [activities, loan])

  const isReviewable =
    loan?.status === 'review' || loan?.status === 'processing'
  const canCancel =
    loan?.status === 'review' ||
    loan?.status === 'processing' ||
    loan?.status === 'approved'
  const isApproved = loan?.status === 'approved'
  const isMutating = isApproving || isRejecting || isCancelling || isDisbursing

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <BackButton label='Back to loans' />
          <h1 className='mt-2 text-3xl font-bold tracking-tight'>
            Loan #{loan?.id}
          </h1>
          <p className='text-muted-foreground mt-2'>
            Review application details and history timeline.
          </p>
        </div>

        {loan ? (
          <div className='flex items-center gap-2'>
            {isReviewable && (
              <>
                <Button
                  onClick={() => approveLoan({ loanId: loanRef })}
                  disabled={isMutating}
                  className='gap-2'
                >
                  <CheckCircle2 className='h-4 w-4' />
                  {isApproving ? 'Approving...' : 'Approve'}
                </Button>
                <Button
                  variant='outline'
                  onClick={() => rejectLoan({ loanId: loanRef })}
                  disabled={isMutating}
                  className='gap-2'
                >
                  <XCircle className='h-4 w-4' />
                  {isRejecting ? 'Rejecting...' : 'Reject'}
                </Button>
              </>
            )}
            {isApproved && (
              <Button
                onClick={() => disburseLoan(loanRef)}
                disabled={isMutating}
              >
                {isDisbursing ? 'Disbursing...' : 'Disburse'}
              </Button>
            )}
            {canCancel && (
              <Button
                variant='destructive'
                onClick={() => cancelLoan({ loanId: loanRef })}
                disabled={isMutating}
                className='gap-2'
              >
                <Ban className='h-4 w-4' />
                {isCancelling ? 'Cancelling...' : 'Cancel Application'}
              </Button>
            )}
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]'>
          <Skeleton className='h-[520px]' />
          <Skeleton className='h-[520px]' />
        </div>
      ) : !loan ? (
        <Card>
          <CardHeader>
            <CardTitle>Loan not found</CardTitle>
            <CardDescription>
              The requested loan could not be loaded.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to='/loans'>
              <Button variant='outline'>Back to loans</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]'>
          <div className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Application Snapshot</CardTitle>
                <CardDescription>
                  Loan {loan.id ?? loan._id} • {loan.loan_type?.loan_name} •
                  Requested on {formatDateTime(loan.created_at)}
                </CardDescription>
              </CardHeader>
              <CardContent className='grid gap-4 sm:grid-cols-2'>
                <div>
                  <p className='text-xs text-muted-foreground'>Status</p>
                  <span
                    className={cn(
                      'mt-1 inline-flex rounded-full px-2 py-1 text-xs font-medium',
                      getStatusColor(loan.status)
                    )}
                  >
                    {loan.status}
                  </span>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground'>Loan Amount</p>
                  <p className='font-semibold'>
                    {formatCurrency(loan.loan_amount)}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground'>
                    Outstanding Balance
                  </p>
                  <p className='font-semibold'>
                    {formatCurrency(Number(loan.balance ?? 0))}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground'>Interest Rate</p>
                  <p className='font-semibold'>
                    {getRateLabel(loan.interest_rate)}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground'>Tenure</p>
                  <p className='font-semibold'>{loan.tenure_days} days</p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground'>Due Date</p>
                  <p className='font-semibold'>
                    {loan.due_date ? formatDate(loan.due_date) : '—'}
                  </p>
                </div>
                <div className='sm:col-span-2'>
                  <p className='text-xs text-muted-foreground'>Purpose</p>
                  <p className='font-medium'>
                    {loan.loan_purpose || 'Not provided'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
                <CardDescription>
                  Chronological events for this loan application.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {timelineItems.length === 0 ? (
                  <p className='text-sm text-muted-foreground'>
                    No activity found for this loan.
                  </p>
                ) : (
                  <ol className='relative ml-3 space-y-5 border-l pl-6'>
                    {timelineItems.map(item => (
                      <li key={item.id} className='relative'>
                        <span
                          className={cn(
                            'absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-background',
                            item.tone === 'success' && 'text-green-600',
                            item.tone === 'warning' && 'text-orange-600',
                            item.tone === 'danger' && 'text-red-600',
                            item.tone === 'default' && 'text-primary'
                          )}
                        >
                          <Circle className='h-3.5 w-3.5 fill-current' />
                        </span>
                        <div className='rounded-lg border bg-card p-3'>
                          <div className='flex items-start justify-between gap-3'>
                            <p className='text-sm font-semibold'>
                              {item.title}
                            </p>
                            <p className='text-xs text-muted-foreground whitespace-nowrap'>
                              {formatDateTime(item.timestamp)}
                            </p>
                          </div>
                          <p className='mt-1 text-sm text-muted-foreground'>
                            {item.description}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          </div>

          <div className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Borrower Snippet</CardTitle>
                <CardDescription>
                  Quick view of the borrower linked to this loan.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='rounded-lg border p-4'>
                  <p className='text-sm font-semibold'>
                    {getCustomerName(borrower)}
                  </p>
                  <div className='mt-3 space-y-2 text-sm text-muted-foreground'>
                    <p className='flex items-center gap-2'>
                      <BadgeCheck className='h-4 w-4' />
                      {borrower?.id_no || 'N/A'}
                    </p>
                    <p className='flex items-center gap-2'>
                      <Phone className='h-4 w-4' />
                      {borrower?.contact?.mobile || 'N/A'}
                    </p>
                    <p className='flex items-center gap-2'>
                      <User className='h-4 w-4' />
                      {borrower?.status || 'N/A'}
                    </p>
                    <p className='flex items-center gap-2'>
                      <Clock3 className='h-4 w-4' />
                      Joined{' '}
                      {borrower?.created_at
                        ? formatDate(borrower.created_at)
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className='flex flex-col gap-2'>
                  <Button
                    variant='outline'
                    onClick={() => setProfileOpen(true)}
                  >
                    Open Full Profile
                  </Button>
                  {(borrower?._id || borrower?.id) && (
                    <Link to={`/customers/${borrower?._id || borrower?.id}`}>
                      <Button variant='ghost' className='w-full'>
                        Open Customer Detail Page
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <BorrowerFlyout
        borrower={borrower}
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </div>
  )
}
