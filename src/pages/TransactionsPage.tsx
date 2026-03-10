import { Button } from '@/components/ui/button'
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
import { useTransactions } from '@/hooks/use-api'
import {
  cn,
  expandEnumString,
  formatCurrency,
  formatDateTime,
  toTitleCase
} from '@/lib/utils'
import { Transaction } from '@/types'
import {
  ArrowUpDown,
  Coins,
  Filter,
  MinusCircle,
  PlusCircle,
  Satellite,
  Search,
  Tag
} from 'lucide-react'
import { useMemo, useState } from 'react'

const statusFilters = [
  { key: 'all', label: 'All' },
  { key: 'completed', label: 'Completed' },
  { key: 'reversed', label: 'Reversed' },
  { key: 'partially_reversed', label: 'Partially Reversed' }
]

const sortFilters = [
  { key: '-created_at', label: 'Newest' },
  { key: 'created_at', label: 'Oldest' },
  { key: '-amount', label: 'Highest Amount' },
  { key: 'amount', label: 'Lowest Amount' }
]

const transactionTypeFilters = [
  { key: 'all', label: 'All' },
  { key: 'credit', label: 'Credit' },
  { key: 'debit', label: 'Debit' }
]

const statusChip = (status: string) => {
  if (status === 'completed') {
    return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
  }
  if (status === 'reversed') {
    return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
  }
  if (status === 'partially_reversed') {
    return 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400'
  }
  return 'bg-slate-100 text-slate-700 dark:bg-slate-950 dark:text-slate-400'
}

const applySort = (rows: Transaction[], sortBy: string) => {
  return [...rows].sort((a, b) => {
    if (sortBy === 'created_at') {
      return +new Date(a.created_at) - +new Date(b.created_at)
    }
    if (sortBy === '-created_at') {
      return +new Date(b.created_at) - +new Date(a.created_at)
    }

    const amountA = Number(a.amount ?? 0)
    const amountB = Number(b.amount ?? 0)

    if (sortBy === 'amount') return amountA - amountB
    if (sortBy === '-amount') return amountB - amountA
    return 0
  })
}

export function TransactionsPage () {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [channelFilter, setChannelFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('-created_at')
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('all')

  const pageSize = 10

  const {
    data: transactionsResponse,
    isLoading,
    isError,
    error
  } = useTransactions({
    page,
    limit: pageSize,
    sort: sortBy,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    payment_channel: channelFilter !== 'all' ? channelFilter : undefined,
    search: searchTerm || undefined
  })

  const transactions = transactionsResponse?.docs ?? []

  const channels = useMemo(() => {
    const values = new Set<string>()
    transactions.forEach(item => {
      if (item.payment_channel) values.add(item.payment_channel)
    })
    return ['all', ...Array.from(values)]
  }, [transactions])

  const filteredTransactions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    const rows = transactions.filter(item => {
      if (statusFilter !== 'all' && item.payment_status !== statusFilter)
        return false
      if (
        transactionTypeFilter !== 'all' &&
        item.payment_type !== transactionTypeFilter
      )
        return false
      if (channelFilter !== 'all' && item.payment_channel !== channelFilter)
        return false
      if (!query) return true

      return [
        item.id,
        item.counterparty,
        item.payment_channel,
        item.payment_account_no,
        item.payment_reference,
        item.payment_type,
        item.payment_account_no_redacted,
        item.paid_via,
        item.cashier
      ]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(query))
    })

    return applySort(rows, sortBy)
  }, [transactions, statusFilter, channelFilter, transactionTypeFilter, searchTerm, sortBy])

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Transactions</h1>
        <p className='text-muted-foreground mt-2'>
          Track transaction performance and payment channels.
        </p>
      </div>

      <Card>
        <CardHeader className='gap-4'>
          <div className='flex flex-wrap items-center justify-between gap-4'>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Filter className='h-4 w-4' />
              Filters
            </div>
            <div className='relative w-full max-w-md'>
              <Search className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
              <Input
                value={searchTerm}
                onChange={e => {
                  setPage(1)
                  setSearchTerm(e.target.value)
                }}
                placeholder='Search by ID, customer, account or cashier...'
                className='pl-9'
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className='space-y-3'>
            <div className='flex flex-wrap items-center gap-2'>
              <span className='text-xs font-medium text-muted-foreground'>
                Status
              </span>
              {statusFilters.map(filter => (
                <button
                  key={filter.key}
                  type='button'
                  onClick={() => {
                    setPage(1)
                    setStatusFilter(filter.key)
                  }}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                    statusFilter === filter.key
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Tag className='h-3 w-3' />
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Transaction Type Filter */}
            <div className='flex flex-wrap items-center gap-2'>
              <span className='text-xs font-medium text-muted-foreground'>
                Transaction Type
              </span>
              {transactionTypeFilters.map(filter => (
                <button
                  key={filter.key}
                  type='button'
                  onClick={() => {
                    setPage(1)
                    setTransactionTypeFilter(filter.key)
                  }}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                    transactionTypeFilter === filter.key
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Coins className='h-3 w-3' />
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Channel Filter */}
            <div className='flex flex-wrap items-center gap-2'>
              <span className='text-xs font-medium text-muted-foreground'>
                Channel
              </span>
              {channels.map(channel => (
                <button
                  key={channel}
                  type='button'
                  onClick={() => {
                    setPage(1)
                    setChannelFilter(channel)
                  }}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                    channelFilter === channel
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Satellite className='h-3 w-3' />
                  {channel === 'all'
                    ? 'All'
                    : toTitleCase(expandEnumString(channel))}
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
                  onClick={() => {
                    setPage(1)
                    setSortBy(filter.key)
                  }}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                    sortBy === filter.key
                      ? 'border-foreground bg-foreground text-background'
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
              {[...Array(8)].map((_, index) => (
                <Skeleton key={index} className='h-12 w-full' />
              ))}
            </div>
          ) : isError ? (
            <div className='py-8 text-sm text-muted-foreground'>
              {(error as any)?.response?.data?.message ||
                (error as Error | undefined)?.message ||
                'Transactions could not be loaded.'}
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className='space-y-4'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-[100px]'></TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Paid Via</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((item, index) => (
                    <TableRow
                      key={
                        item._id ||
                        item.id ||
                        `${item.counterparty ?? 'tx'}-${index}`
                      }
                    >
                      <TableCell>
                        {/* add an icon to show credit or debit */}
                        {item.payment_type === 'credit' ? (
                          <PlusCircle className='h-4 w-4 text-green-500' />
                        ) : (
                          <MinusCircle className='h-4 w-4 text-red-500' />
                        )}
                      </TableCell>
                      <TableCell className='font-medium'>{item.payment_reference}</TableCell>
                      <TableCell>
                        {`${item.counterparty?.other_names} ${item.counterparty?.surname}` ||
                          '—'}
                      </TableCell>
                      <TableCell>
                        {toTitleCase(expandEnumString(item.payment_channel))}
                      </TableCell>
                      {/* show plain or redactedaccount number based on a toggle icon */}
                      <TableCell>
                        {item.payment_account_no_redacted ||
                          item.payment_account_no}
                      </TableCell>
                      <TableCell>{item.paid_via}</TableCell>
                      <TableCell className='font-numbers'>
                        {formatCurrency(Number(item.amount ?? 0))}
                      </TableCell>
                      <TableCell className='font-numbers'>
                        {formatCurrency(Number(item.transaction_fee ?? 0))}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                            statusChip(item.payment_status)
                          )}
                        >
                          {item.payment_status}
                        </span>
                      </TableCell>
                      <TableCell>{formatDateTime(item.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className='flex flex-wrap items-center justify-between gap-3'>
                <p className='text-sm text-muted-foreground'>
                  Showing {filteredTransactions.length} of{' '}
                  {transactionsResponse?.totalDocs ??
                    filteredTransactions.length}{' '}
                  transactions
                </p>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    disabled={!transactionsResponse?.hasPrevPage}
                  >
                    Previous
                  </Button>
                  <span className='text-sm text-muted-foreground'>
                    Page {transactionsResponse?.page ?? page} of{' '}
                    {transactionsResponse?.totalPages ?? 1}
                  </span>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setPage(prev => prev + 1)}
                    disabled={!transactionsResponse?.hasNextPage}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className='py-12 text-center text-sm text-muted-foreground'>
              No transactions found for the selected filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
