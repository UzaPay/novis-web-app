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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useBanCustomer,
  useCustomer,
  useCustomerCashbackLedger,
  useCustomerCashbackWallet,
  useCustomerCreditReports,
  useCustomerLoans,
  useCustomerTransactions,
  useUpdateCustomerLoanStatus
} from '@/hooks/use-api'
import {
  cn,
  expandEnumString,
  formatCurrency,
  formatDate,
  formatDateTime,
  toTitleCase
} from '@/lib/utils'
import {
  ArrowLeft,
  Ban,
  Coins,
  HandCoins,
  MinusCircle,
  PlusCircle,
  ToggleLeft,
  ToggleRight,
  Wallet
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

const statusBadgeClass = (status?: string) => {
  if (status === 'active')
    return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
  if (status === 'banned')
    return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
  if (status === 'suspended')
    return 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400'
  if (status === 'inactive')
    return 'bg-slate-100 text-slate-700 dark:bg-slate-950 dark:text-slate-400'
  return 'bg-slate-100 text-slate-700 dark:bg-slate-950 dark:text-slate-400'
}

export function CustomerDetailPage () {
  const { id = '' } = useParams()

  const { data: customer, isLoading, isError, error } = useCustomer(id)

  const customerRef = customer?._id || customer?.id || id

  const { data: customerLoans } = useCustomerLoans(customerRef, {
    page: 1,
    limit: 10
  })
  const { data: creditReports } = useCustomerCreditReports(customerRef)
  const { data: customerTransactions } = useCustomerTransactions(customerRef, {
    page: 1,
    limit: 10,
    sort: '-created_at'
  })
  const { data: wallet } = useCustomerCashbackWallet(customerRef)
  const { data: cashbackLedger } = useCustomerCashbackLedger(customerRef)

  const { mutate: banCustomer, isPending: banning } = useBanCustomer()
  const { mutate: updateLoanStatus, isPending: updatingLoanStatus } =
    useUpdateCustomerLoanStatus()

  const toggleLoanStatus = () => {
    if (!customer) return

    const targetStatus =
      customer.loan_status === 'active' ? 'inactive' : 'active'
    updateLoanStatus({
      customerId: customer._id || customer.id || id,
      loan_status: targetStatus
    })
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <Link
            to='/customers'
            className='inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground'
          >
            <ArrowLeft className='h-4 w-4' />
            Back to customers
          </Link>
          <h1 className='mt-2 text-3xl font-bold tracking-tight'>
            Customer Detail
          </h1>
          <p className='text-muted-foreground mt-2'>
            Comprehensive customer profile, activity and account sections.
          </p>
        </div>

        {customer && (
          <div className='flex flex-wrap items-center gap-2'>
            <Button
              variant='destructive'
              className='gap-2'
              onClick={() => banCustomer(customer._id || customer.id || id)}
              disabled={banning || updatingLoanStatus}
            >
              <Ban className='h-4 w-4' />
              {banning ? 'Banning...' : 'Ban User'}
            </Button>
            <Button
              variant='outline'
              className='gap-2'
              onClick={toggleLoanStatus}
              disabled={banning || updatingLoanStatus}
            >
              {customer.loan_status === 'active' ? (
                <ToggleLeft className='h-4 w-4' />
              ) : (
                <ToggleRight className='h-4 w-4' />
              )}
              {updatingLoanStatus
                ? 'Updating...'
                : customer.loan_status === 'active'
                ? 'Mark Loan Inactive'
                : 'Mark Loan Active'}
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <Skeleton className='h-[520px]' />
      ) : isError || !customer ? (
        <Card>
          <CardHeader>
            <CardTitle>Customer not found</CardTitle>
            <CardDescription>
              {(error as any)?.response?.data?.message ||
                (error as Error | undefined)?.message ||
                'The customer record could not be loaded.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to='/customers'>
              <Button variant='outline'>Back to customers</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className='flex flex-wrap items-start justify-between gap-3'>
                <div>
                  <CardTitle className='text-2xl'>
                    {`${customer.other_names ?? ''} ${
                      customer.surname ?? ''
                    }`.trim() ||
                      customer.username ||
                      'Unnamed User'}
                  </CardTitle>
                  <CardDescription className='mt-1'>
                    ID: {customer.id ?? customer._id} • Joined{' '}
                    {formatDate(customer.created_at)}
                  </CardDescription>
                </div>
                <div className='flex gap-2'>
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                      statusBadgeClass(customer.status)
                    )}
                  >
                    {customer.status}
                  </span>
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                      statusBadgeClass(customer.loan_status)
                    )}
                  >
                    Loan: {customer.loan_status || 'inactive'}
                  </span>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Tabs defaultValue='profile' className='space-y-4'>
            <TabsList className='h-auto flex-wrap justify-start gap-2 bg-transparent p-0'>
              <TabsTrigger value='profile'>Profile</TabsTrigger>
              <TabsTrigger value='credit-reports'>Credit Reports</TabsTrigger>
              <TabsTrigger value='loan-applications'>
                Loan Applications
              </TabsTrigger>
              <TabsTrigger value='transactions'>Transactions</TabsTrigger>
              <TabsTrigger value='wallet'>Cashback Wallet</TabsTrigger>
              <TabsTrigger value='ledger'>Cashback Ledger</TabsTrigger>
            </TabsList>

            <TabsContent value='profile'>
              <div className='grid gap-4 lg:grid-cols-2'>
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Details</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-2 text-sm'>
                    <p>
                      <span className='font-medium'>National ID:</span>{' '}
                      {customer.id_no || '—'}
                    </p>
                    <p>
                      <span className='font-medium'>Role:</span> {customer.role}
                    </p>
                    <p>
                      <span className='font-medium'>Language:</span>{' '}
                      {customer.lang || '—'}
                    </p>
                    <p>
                      <span className='font-medium'>Marital Status:</span>{' '}
                      {customer.marital_status || '—'}
                    </p>
                    <p>
                      <span className='font-medium'>Dependants:</span>{' '}
                      {customer.no_of_dependants ?? 0}
                    </p>
                    <p>
                      <span className='font-medium'>Risk Flags:</span>{' '}
                      {(customer.risk_flags ?? []).join(', ') || '—'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Contact & Financial</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-2 text-sm'>
                    <p>
                      <span className='font-medium'>Mobile:</span>{' '}
                      {customer.contact?.mobile || '—'}
                    </p>
                    <p>
                      <span className='font-medium'>Email:</span>{' '}
                      {customer.contact?.email || customer.email || '—'}
                    </p>
                    <p>
                      <span className='font-medium'>City:</span>{' '}
                      {customer.contact?.city || '—'}
                    </p>
                    <p>
                      <span className='font-medium'>County:</span>{' '}
                      {customer.contact?.county_of_residence || '—'}
                    </p>
                    <p>
                      <span className='font-medium'>Monthly Income:</span>{' '}
                      {formatCurrency(Number(customer.monthly_income ?? 0))}
                    </p>
                    <p>
                      <span className='font-medium'>Income Source:</span>{' '}
                      {customer.income_source || '—'}
                    </p>
                    <p>
                      <span className='font-medium'>Available Loan Limit:</span>{' '}
                      {formatCurrency(
                        Number(customer.available_loan_limit ?? 0)
                      )}
                    </p>
                    <p>
                      <span className='font-medium'>Max Loan Limit:</span>{' '}
                      {formatCurrency(Number(customer.max_loan_limit ?? 0))}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value='credit-reports'>
              <Card>
                <CardHeader>
                  <CardTitle>Credit Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  {(creditReports ?? []).length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Report ID</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Has Accounts</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {creditReports?.map(report => (
                          <TableRow key={report._id}>
                            <TableCell>{report.id ?? report._id}</TableCell>
                            <TableCell>{report.report_type}</TableCell>
                            <TableCell>{report.processing_status}</TableCell>
                            <TableCell>
                              {report.has_accounts ? 'Yes' : 'No'}
                            </TableCell>
                            <TableCell>
                              {formatDateTime(report.created_at)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className='text-sm text-muted-foreground'>
                      No credit reports found.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='loan-applications'>
              <Card>
                <CardHeader>
                  <CardTitle>Loan Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  {(customerLoans?.docs ?? []).length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Loan ID</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Balance</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customerLoans?.docs.map(loan => (
                          <TableRow key={loan._id || loan.id}>
                            <TableCell>
                              <Link
                                to={`/loans/${loan._id || loan.id}`}
                                className='text-primary hover:underline'
                              >
                                {loan.id ?? loan._id}
                              </Link>
                            </TableCell>
                            <TableCell>
                              {formatCurrency(loan.loan_amount)}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(Number(loan.balance ?? 0))}
                            </TableCell>
                            <TableCell>{loan.status}</TableCell>
                            <TableCell>
                              {formatDateTime(loan.created_at)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className='text-sm text-muted-foreground'>
                      No loan applications found.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='transactions'>
              <Card>
                <CardHeader>
                  <CardTitle>Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  {(customerTransactions?.docs ?? []).length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead></TableHead>
                          <TableHead>ID</TableHead>
                          <TableHead>Channel</TableHead>
                          <TableHead>Account</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customerTransactions?.docs.map(transaction => (
                          <TableRow key={transaction._id}>
                            <TableCell>
                              {transaction.payment_type === 'credit' ? (
                                <PlusCircle className='h-4 w-4 text-green-500' />
                              ) : (
                                <MinusCircle className='h-4 w-4 text-red-500' />
                              )}
                            </TableCell>
                            <TableCell>{transaction.payment_reference}</TableCell>
                            <TableCell>
                              {toTitleCase(
                                expandEnumString(transaction.payment_channel)
                              )}
                            </TableCell>
                            <TableCell>
                              {transaction.payment_account_no_redacted ||
                                transaction.payment_account_no}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(Number(transaction.amount ?? 0))}
                            </TableCell>
                            <TableCell>{transaction.payment_status}</TableCell>
                            <TableCell>
                              {formatDateTime(transaction.created_at)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className='text-sm text-muted-foreground'>
                      No transactions found.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='wallet'>
              <Card>
                <CardHeader>
                  <CardTitle>Cashback Wallet</CardTitle>
                  <CardDescription>
                    Current cashback wallet summary.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {wallet ? (
                    <div className='grid gap-3 sm:grid-cols-3'>
                      <div className='rounded-lg border p-4'>
                        <Wallet className='mb-5 h-6 w-6 text-muted-foreground' />
                        <p className='text-xs text-muted-foreground'>
                          Available Balance
                        </p>
                        <p className='text-lg font-semibold'>
                          {formatCurrency(wallet.available_balance ?? 0)}
                        </p>
                      </div>
                      <div className='rounded-lg border p-4'>
                        <HandCoins className='mb-5 h-6 w-6 text-muted-foreground' />
                        <p className='text-xs text-muted-foreground'>
                          Lifetime Earned
                        </p>
                        <p className='text-lg font-semibold'>
                          {formatCurrency(wallet.lifetime_earned ?? 0)}
                        </p>
                      </div>
                      <div className='rounded-lg border p-4'>
                        <Coins className='mb-5 h-6 w-6 text-muted-foreground' />
                        <p className='text-xs text-muted-foreground'>
                          Lifetime Used
                        </p>
                        <p className='text-lg font-semibold'>
                          {formatCurrency(wallet.lifetime_used ?? 0)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className='text-sm text-muted-foreground'>
                      No cashback wallet found.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='ledger'>
              <Card>
                <CardHeader>
                  <CardTitle>Cashback Ledger</CardTitle>
                </CardHeader>
                <CardContent>
                  {(cashbackLedger ?? []).length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Earned Reason</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Awarded</TableHead>
                          <TableHead>Expires</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cashbackLedger?.map(entry => (
                          <TableRow key={entry._id}>
                            <TableCell>{entry.description}</TableCell>
                            <TableCell>{entry.earned_reason}</TableCell>
                            <TableCell>
                              {formatCurrency(entry.cashback_amount)}
                            </TableCell>
                            <TableCell>{entry.status}</TableCell>
                            <TableCell>
                              {formatDateTime(entry.awarded_at)}
                            </TableCell>
                            <TableCell>
                              {formatDateTime(entry.expires_at)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className='text-sm text-muted-foreground'>
                      No cashback ledger entries found.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
