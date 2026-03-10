import { motion } from 'framer-motion'
import { Tag, Percent } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useLoanTypes } from '@/hooks/use-api'
import { formatCurrency, cn } from '@/lib/utils'
import { LoanType } from '@/types'

const getCategoryName = (category: LoanType['category']) => {
  if (!category) return 'Uncategorized'
  if (typeof category === 'string') return 'Uncategorized'
  return category.name
}

const formatRate = (rawRate: number) => {
  const normalized = rawRate <= 1 ? rawRate * 100 : rawRate
  const decimals = Number.isInteger(normalized) ? 0 : 2
  return `${normalized.toFixed(decimals)}%`
}

export function LoanTypesPage () {
  const { data: loanTypes, isLoading } = useLoanTypes()
  const grouped = (loanTypes ?? []).reduce<Record<string, LoanType[]>>(
    (acc: Record<string, LoanType[]>, loanType: LoanType) => {
      const key = getCategoryName(loanType.category)
      if (!acc[key]) acc[key] = []
      acc[key].push(loanType)
      return acc
    },
    {}
  )

  const categoryEntries = Object.entries(grouped) as Array<[string, LoanType[]]>

  const cardGradients = [
    'from-sky-500/10 via-transparent to-emerald-500/10',
    'from-amber-500/10 via-transparent to-rose-500/10',
    'from-indigo-500/10 via-transparent to-fuchsia-500/10',
    'from-teal-500/10 via-transparent to-lime-500/10',
    'from-orange-500/10 via-transparent to-yellow-500/10'
  ]

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Loan Types</h1>
        <p className='text-muted-foreground mt-2'>
          Available loan products and their terms
        </p>
      </div>

      {isLoading ? (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className='h-48' />
          ))}
        </div>
      ) : categoryEntries.length > 0 ? (
        <div className='space-y-8'>
          {categoryEntries.map(([categoryName, types], categoryIndex: number) => (
            <div key={categoryName} className='space-y-4'>
              <div className='flex flex-wrap items-center justify-between gap-3'>
                <div>
                  <h2 className='text-xl font-semibold'>{categoryName}</h2>
                  <p className='text-sm text-muted-foreground'>
                    {types.length} loan type{types.length === 1 ? '' : 's'}
                  </p>
                </div>
                <span className='rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground'>
                  {types.length} total
                </span>
              </div>

              <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                {types.map((loanType: LoanType, index) => {
                  const gradient =
                    cardGradients[
                      (categoryIndex + index) % cardGradients.length
                    ]
                  return (
                    <motion.div
                      key={loanType._id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.02 }}
                    >
                      <Card
                        className={cn(
                          'hover:shadow-lg transition-shadow border-muted/60 overflow-hidden'
                        )}
                      >
                        <div
                          className={cn(
                            'h-1 w-full bg-gradient-to-r',
                            gradient
                          )}
                        />
                        <CardHeader>
                          <div className='flex items-start justify-between'>
                            <div className='flex items-center gap-3'>
                              <div className='h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center'>
                                <Tag className='h-5 w-5 text-primary' />
                              </div>
                              <div>
                                <CardTitle className='text-lg'>
                                  {loanType.loan_name}
                                </CardTitle>
                                <CardDescription className='mt-1'>
                                  {loanType.description}
                                </CardDescription>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className='space-y-3'>
                          <div className='flex items-center justify-between'>
                            <span className='text-sm text-muted-foreground'>
                              Interest Rate
                            </span>
                            <span className='font-numbers font-semibold text-primary flex items-center gap-1'>
                              {formatRate(Number(loanType.interest_rate_percent))}
                              <Percent className='h-3 w-3' />
                            </span>
                          </div>
                          <div className='flex items-center justify-between'>
                            <span className='text-sm text-muted-foreground'>
                              Amount Range
                            </span>
                            <span className='font-numbers text-sm font-medium'>
                              {formatCurrency(Number(loanType.min_loan_amount))}{' '}
                              -{' '}
                              {formatCurrency(Number(loanType.max_loan_amount))}
                            </span>
                          </div>
                          <div className='flex items-center justify-between'>
                            <span className='text-sm text-muted-foreground'>
                              Interest Frequency
                            </span>
                            <span className='text-sm font-medium'>
                              {loanType.interest_frequency_days} days
                            </span>
                          </div>
                          <div className='flex items-center justify-between'>
                            <span className='text-sm text-muted-foreground'>
                              Max Repayment
                            </span>
                            <span className='text-sm font-medium'>
                              {loanType.max_repayment_period} days
                            </span>
                          </div>
                          <div className='flex items-center justify-between'>
                            <span className='text-sm text-muted-foreground'>
                              Min Guarantors
                            </span>
                            <span className='text-sm font-medium'>
                              {loanType.min_guarantors}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-12'>
            <Tag className='h-12 w-12 text-muted-foreground mb-4' />
            <p className='text-lg font-medium'>No loan types found</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
