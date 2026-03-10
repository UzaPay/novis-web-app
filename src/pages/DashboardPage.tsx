import { AnimatedNumber } from '@/components/AnimatedNumber'
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
  useActivityLog,
  useCompleteAnalysis,
  usePortfolioMetrics
} from '@/hooks/use-api'
import { cn, formatCurrency, formatDateTime, formatNumber } from '@/lib/utils'
import { ActivityLog } from '@/types'
import { motion } from 'framer-motion'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  TrendingUp
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'

const COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899'
]

type CohortChartPoint = {
  month: string
  repaymentPercentage: number
  loanCount: number
  totalDisbursed: number
}

const formatCohortMonth = (month: string) => {
  const [year, monthIndex] = month.split('-').map(Number)
  if (!year || !monthIndex) return month
  const date = new Date(year, monthIndex - 1, 1)
  return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
}

function CohortCanvasChart ({ data }: { data: CohortChartPoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const observer = new ResizeObserver(entries => {
      const nextWidth = entries[0]?.contentRect.width ?? 0
      setContainerWidth(nextWidth)
    })

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || containerWidth === 0 || data.length === 0) return

    const height = 300
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.floor(containerWidth * dpr)
    canvas.height = Math.floor(height * dpr)
    canvas.style.width = `${containerWidth}px`
    canvas.style.height = `${height}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, containerWidth, height)

    const padding = { top: 20, right: 24, bottom: 42, left: 38 }
    const chartWidth = containerWidth - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom
    const yMax = 1
    const step = chartWidth / Math.max(data.length, 1)
    const barWidth = Math.min(26, step * 0.62)

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)'
    ctx.lineWidth = 1
    ctx.fillStyle = 'rgba(100, 116, 139, 0.8)'
    ctx.font = '11px Archivo, Inter, sans-serif'

    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(containerWidth - padding.right, y)
      ctx.stroke()

      const value = ((4 - i) / 4) * yMax * 100
      ctx.fillText(`${value.toFixed(0)}%`, 4, y + 4)
    }

    const linePoints: { x: number; y: number }[] = []

    data.forEach((point, index) => {
      const x = padding.left + step * index + step / 2
      const ratio = Math.max(0, Math.min(point.repaymentPercentage, yMax))
      const y = padding.top + chartHeight - ratio * chartHeight
      linePoints.push({ x, y })

      const baseY = padding.top + chartHeight
      const barX = x - barWidth / 2
      const barY = y
      const barHeight = baseY - barY

      const isHovered = hoveredIndex === index
      const barGradient = ctx.createLinearGradient(0, barY, 0, baseY)
      barGradient.addColorStop(0, isHovered ? 'rgba(59,130,246,0.95)' : 'rgba(59,130,246,0.75)')
      barGradient.addColorStop(1, isHovered ? 'rgba(14,165,233,0.5)' : 'rgba(14,165,233,0.2)')
      ctx.fillStyle = barGradient

      ctx.beginPath()
      ctx.roundRect(barX, barY, barWidth, barHeight, 6)
      ctx.fill()

      ctx.fillStyle = 'rgba(100, 116, 139, 0.85)'
      ctx.fillText(formatCohortMonth(point.month), x - 14, height - 16)
    })

    if (linePoints.length > 1) {
      ctx.strokeStyle = 'rgba(30, 64, 175, 0.95)'
      ctx.lineWidth = 2
      ctx.beginPath()
      linePoints.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y)
        else ctx.lineTo(point.x, point.y)
      })
      ctx.stroke()
    }

    linePoints.forEach((point, index) => {
      ctx.fillStyle = hoveredIndex === index ? 'rgba(30,64,175,1)' : 'rgba(59,130,246,0.9)'
      ctx.beginPath()
      ctx.arc(point.x, point.y, hoveredIndex === index ? 4 : 3, 0, Math.PI * 2)
      ctx.fill()
    })
  }, [containerWidth, data, hoveredIndex])

  const handleMouseMove = (event: MouseEvent<HTMLCanvasElement>) => {
    if (!containerRef.current || data.length === 0) return
    const rect = containerRef.current.getBoundingClientRect()
    const relativeX = event.clientX - rect.left
    const paddingLeft = 38
    const paddingRight = 24
    const chartWidth = rect.width - paddingLeft - paddingRight
    const step = chartWidth / Math.max(data.length, 1)
    const index = Math.floor((relativeX - paddingLeft) / step)

    if (index >= 0 && index < data.length) {
      setHoveredIndex(index)
    } else {
      setHoveredIndex(null)
    }
  }

  const hoveredPoint = hoveredIndex !== null ? data[hoveredIndex] : null

  return (
    <div ref={containerRef} className='relative h-[300px] w-full rounded-xl bg-gradient-to-b from-background to-muted/20'>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIndex(null)}
        className='h-full w-full'
      />
      {hoveredPoint && (
        <div className='pointer-events-none absolute right-3 top-3 rounded-lg border bg-background/95 px-3 py-2 shadow-sm backdrop-blur'>
          <p className='text-xs font-medium text-muted-foreground'>{hoveredPoint.month}</p>
          <p className='text-xs'>Repayment: {(hoveredPoint.repaymentPercentage * 100).toFixed(1)}%</p>
          <p className='text-xs'>Loans: {hoveredPoint.loanCount}</p>
        </div>
      )}
    </div>
  )
}

function KPICard ({
  title,
  value,
  format,
  icon: Icon,
  trend,
  comparison,
  color = 'blue'
}: any) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className='overflow-hidden border-muted/60'>
        <div
          className={cn(
            'h-1 w-full bg-gradient-to-r',
            color === 'blue' && 'from-blue-500/40 via-blue-400/10 to-cyan-400/40',
            color === 'green' && 'from-emerald-500/40 via-emerald-400/10 to-lime-400/40',
            color === 'orange' && 'from-amber-500/40 via-orange-400/10 to-yellow-400/40',
            color === 'red' && 'from-rose-500/40 via-red-400/10 to-orange-400/40'
          )}
        />
        <CardContent className='p-6'>
          <div className='flex items-center justify-between mb-2'>
            <p className='text-sm font-medium text-muted-foreground'>{title}</p>
            <div
              className={cn(
                'h-10 w-10 rounded-full flex items-center justify-center',
                color === 'blue' && 'bg-blue-100 dark:bg-blue-950',
                color === 'green' && 'bg-green-100 dark:bg-green-950',
                color === 'orange' && 'bg-orange-100 dark:bg-orange-950',
                color === 'red' && 'bg-red-100 dark:bg-red-950'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5',
                  color === 'blue' && 'text-blue-600 dark:text-blue-400',
                  color === 'green' && 'text-green-600 dark:text-green-400',
                  color === 'orange' && 'text-orange-600 dark:text-orange-400',
                  color === 'red' && 'text-red-600 dark:text-red-400'
                )}
              />
            </div>
          </div>
          <div className='space-y-1'>
            <p className='text-3xl font-bold font-numbers'>
              <AnimatedNumber value={value} format={format} />
            </p>
            {trend && (
              <p className='text-xs text-muted-foreground flex items-center gap-1'>
                {trend}
              </p>
            )}
            {comparison && (
              <p className='text-[11px] text-muted-foreground/80'>
                {comparison}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function ActivityFeed () {
  const { data: activities, isLoading } = useActivityLog(20)

  return (
    <Card className='col-span-1'>
      <CardHeader>
        <CardTitle>Live Activity</CardTitle>
        <CardDescription>Real-time loan activity feed</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='space-y-3'>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className='h-16' />
            ))}
          </div>
        ) : (
          <div className='space-y-3 max-h-96 overflow-y-auto'>
            {activities && Array.isArray(activities) && activities.length > 0 ? (
              (Array.isArray(activities[0]) ? (activities as unknown as any[]).flat() : (activities as unknown as ActivityLog[])).map((activity: ActivityLog) => (
                <motion.div
                  key={activity._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className='flex gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors'
                >
                  {(() => {
                    const activityType = activity.activity_type ?? ''
                    const isDisbursed = activityType === 'LOAN_DISBURSED'
                    const isRepayment =
                      activityType === 'LOAN_REPAID_FULL' ||
                      activityType === 'LOAN_REPAID_PARTIAL' ||
                      activityType === 'LOAN_REPAYMENT_FULL' ||
                      activityType === 'LOAN_REPAYMENT_PARTIAL'
                    const isLateFee = activityType === 'LOAN_LATE_FEE_APPLIED'
                    const isApproved = activityType === 'LOAN_APPROVED'
                    const isRejected = activityType === 'LOAN_REJECTED'

                    return (
                      <div
                        className={cn(
                          'h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0',
                          isDisbursed && 'bg-blue-100 dark:bg-blue-950',
                          (isRepayment || isApproved) &&
                            'bg-green-100 dark:bg-green-950',
                          isLateFee && 'bg-orange-100 dark:bg-orange-950',
                          isRejected && 'bg-red-100 dark:bg-red-950'
                        )}
                      >
                        {isDisbursed && (
                          <TrendingUp className='h-5 w-5 text-blue-600' />
                        )}
                        {isRepayment && (
                          <CheckCircle className='h-5 w-5 text-green-600' />
                        )}
                        {isLateFee && (
                          <AlertCircle className='h-5 w-5 text-orange-600' />
                        )}
                        {isApproved && (
                          <CheckCircle className='h-5 w-5 text-green-600' />
                        )}
                        {isRejected && (
                          <AlertCircle className='h-5 w-5 text-red-600' />
                        )}
                      </div>
                    )
                  })()}
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium truncate'>
                      {activity.activity_name}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {activity.description || activity.message}
                    </p>
                    <div className='flex items-center gap-2 mt-1'>
                      {/* <span className='font-numbers text-sm font-semibold'>
                        {formatCurrency(activity.amount)}
                      </span> */}
                      <span className='text-xs text-muted-foreground'>
                        {formatDateTime(activity.created_at)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className='text-sm text-muted-foreground text-center py-8'>
                No recent activity
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

type RangeKey = 'mtd' | 'qtd' | 'ytd' | '7d' | '30d' | 'custom'

const rangeOptions: { key: RangeKey; label: string }[] = [
  { key: 'mtd', label: 'Month to Date' },
  { key: 'qtd', label: 'Quarter to Date' },
  { key: 'ytd', label: 'Year to Date' },
  { key: '7d', label: 'Last 7 Days' },
  { key: '30d', label: 'Last 30 Days' },
  { key: 'custom', label: 'Custom' }
]

const startOfQuarter = (date: Date) => {
  const quarter = Math.floor(date.getMonth() / 3)
  return new Date(date.getFullYear(), quarter * 3, 1)
}

const formatRangeLabel = (start: Date, end: Date) =>
  `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`

export function DashboardPage () {
  const { data: metrics, isLoading: metricsLoading } = usePortfolioMetrics()
  const { data: analysis, isLoading: analysisLoading } = useCompleteAnalysis()
  useActivityLog(20)
  const [rangeKey, setRangeKey] = useState<RangeKey>('mtd')
  const [customStart, setCustomStart] = useState<string>('')
  const [customEnd, setCustomEnd] = useState<string>('')

  const { rangeLabel, comparisonLabel } = useMemo(() => {
    const today = new Date()
    let start = new Date(today)
    let end = new Date(today)

    if (rangeKey === 'mtd') {
      start = new Date(today.getFullYear(), today.getMonth(), 1)
    } else if (rangeKey === 'qtd') {
      start = startOfQuarter(today)
    } else if (rangeKey === 'ytd') {
      start = new Date(today.getFullYear(), 0, 1)
    } else if (rangeKey === '7d') {
      start = new Date(today)
      start.setDate(today.getDate() - 6)
    } else if (rangeKey === '30d') {
      start = new Date(today)
      start.setDate(today.getDate() - 29)
    } else if (rangeKey === 'custom') {
      start = customStart ? new Date(customStart) : new Date(today.getFullYear(), today.getMonth(), 1)
      end = customEnd ? new Date(customEnd) : today
    }

    const diffMs = end.getTime() - start.getTime()
    const prevEnd = new Date(start.getTime() - 24 * 60 * 60 * 1000)
    const prevStart = new Date(prevEnd.getTime() - diffMs)

    return {
      rangeLabel: formatRangeLabel(start, end),
      comparisonLabel: `Comparing to ${formatRangeLabel(prevStart, prevEnd)}`
    }
  }, [rangeKey, customStart, customEnd])

  const cohortChartData = useMemo<CohortChartPoint[]>(() => {
    const rawCohorts = (analysis as unknown as {
      vintageCohorts?: Array<Record<string, unknown>>
      vintageAnalysis?: { cohorts?: Array<Record<string, unknown>> }
    })?.vintageCohorts
      ?? (analysis as unknown as {
        vintageAnalysis?: { cohorts?: Array<Record<string, unknown>> }
      })?.vintageAnalysis?.cohorts
      ?? []

    return rawCohorts
      .map((item) => {
        const month = String(
          item.month
          ?? item.cohortMonth
          ?? item.cohort
          ?? item.period
          ?? ''
        )

        let repaymentPercentage = Number(
          item.repaymentPercentage
          ?? item.repayment_rate
          ?? item.repaymentRatio
          ?? item.repayment
          ?? 0
        )

        if (repaymentPercentage > 1) {
          repaymentPercentage = repaymentPercentage / 100
        }

        return {
          month,
          repaymentPercentage: Number.isFinite(repaymentPercentage) ? repaymentPercentage : 0,
          loanCount: Number(item.loanCount ?? item.count ?? item.loans ?? 0),
          totalDisbursed: Number(item.totalDisbursed ?? item.disbursed ?? item.amount ?? 0)
        }
      })
      .filter(item => item.month.length > 0)
      .sort((a, b) => a.month.localeCompare(b.month))
  }, [analysis])

  const handleExportExcel = () => {
    if (!analysis) {
      toast.error('No data available to export')
      return
    }

    const wb = XLSX.utils.book_new()

    // Sheet 1: Portfolio Metrics
    const metricsData = [
      ['Portfolio Overview - As of ' + new Date().toLocaleDateString()],
      [''],
      ['Metric', 'Value'],
      ['Total Loans', analysis.portfolioMetrics.totalLoans],
      ['Total Disbursed', analysis.portfolioMetrics.totalDisbursed],
      ['Outstanding Balance', analysis.portfolioMetrics.outstandingBalance],
      ['Principal Repaid', analysis.portfolioMetrics.principalRepaid],
      [
        'Repayment Rate',
        `${(analysis.portfolioMetrics.repaymentRate * 100).toFixed(1)}%`
      ],
      ['Average Loan Size', analysis.portfolioMetrics.averageLoanSize],
      ['Unique Borrowers', analysis.portfolioMetrics.uniqueBorrowers]
    ]
    const metricsWs = XLSX.utils.aoa_to_sheet(metricsData)
    XLSX.utils.book_append_sheet(wb, metricsWs, 'Portfolio Metrics')

    // Sheet 2: Status Distribution
    if (analysis.statusDistribution) {
      const statusData = [
        ['Status Distribution'],
        [''],
        ['Status', 'Count', 'Disbursed', 'Outstanding'],
        ...analysis.statusDistribution.map(s => [
          s.status,
          s.count,
          s.disbursed,
          s.outstanding
        ])
      ]
      const statusWs = XLSX.utils.aoa_to_sheet(statusData)
      XLSX.utils.book_append_sheet(wb, statusWs, 'Status Distribution')
    }

    // Sheet 3: DPD Buckets
    if (analysis.dpdBuckets) {
      const dpdData = [
        ['Delinquency Analysis - DPD Buckets'],
        [''],
        [
          'Range',
          'Count',
          '% of Total',
          'Outstanding',
          '% of Balance',
          'Avg Balance'
        ],
        ...analysis.dpdBuckets.map(b => [
          b.range,
          b.count,
          (b.percentage * 100).toFixed(1) + '%',
          b.outstanding,
          (b.balancePercentage * 100).toFixed(1) + '%',
          b.averageBalance
        ])
      ]
      const dpdWs = XLSX.utils.aoa_to_sheet(dpdData)
      XLSX.utils.book_append_sheet(wb, dpdWs, 'DPD Buckets')
    }

    // Sheet 4: Vintage Cohorts
    if (analysis.vintageCohorts) {
      const vintageData = [
        ['Vintage Analysis - Monthly Cohorts'],
        [''],
        [
          'Month',
          'Loan Count',
          'Total Disbursed',
          'Avg Loan Size',
          'Outstanding',
          'Repaid',
          'Repayment %'
        ],
        ...analysis.vintageCohorts.map(v => [
          v.month,
          v.loanCount,
          v.totalDisbursed,
          v.averageLoanSize,
          v.outstanding,
          v.repaid,
          (v.repaymentPercentage * 100).toFixed(1) + '%'
        ])
      ]
      const vintageWs = XLSX.utils.aoa_to_sheet(vintageData)
      XLSX.utils.book_append_sheet(wb, vintageWs, 'Vintage Analysis')
    }

    XLSX.writeFile(
      wb,
      `loan-analysis-${new Date().toISOString().split('T')[0]}.xlsx`
    )
    toast.success('Excel report downloaded successfully')
  }

  const handleExportPDF = () => {
    if (!analysis) {
      toast.error('No data available to export')
      return
    }

    const doc = new jsPDF()

    doc.setFontSize(18)
    doc.text('Loan Portfolio Analysis', 14, 20)
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28)

    // Portfolio Metrics
    autoTable(doc, {
      startY: 35,
      head: [['Metric', 'Value']],
      body: [
        ['Total Loans', analysis.portfolioMetrics.totalLoans.toString()],
        [
          'Total Disbursed',
          formatCurrency(analysis.portfolioMetrics.totalDisbursed)
        ],
        [
          'Outstanding',
          formatCurrency(analysis.portfolioMetrics.outstandingBalance)
        ],
        [
          'Repayment Rate',
          `${(analysis.portfolioMetrics.repaymentRate * 100).toFixed(1)}%`
        ],
        [
          'Unique Borrowers',
          analysis.portfolioMetrics.uniqueBorrowers.toString()
        ]
      ]
    })

    // Status Distribution
    if (analysis.statusDistribution) {
      doc.addPage()
      doc.setFontSize(14)
      doc.text('Status Distribution', 14, 20)

      autoTable(doc, {
        startY: 25,
        head: [['Status', 'Count', 'Disbursed', 'Outstanding']],
        body: analysis.statusDistribution.map(s => [
          s.status,
          s.count.toString(),
          formatCurrency(s.disbursed),
          formatCurrency(s.outstanding)
        ])
      })
    }

    doc.save(`loan-analysis-${new Date().toISOString().split('T')[0]}.pdf`)
    toast.success('PDF report downloaded successfully')
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-center justify-between gap-4 rounded-3xl border bg-gradient-to-br from-background via-background to-muted/50 p-6 shadow-sm'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Dashboard</h1>
          <p className='text-muted-foreground mt-2'>
            Portfolio overview and key metrics
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={handleExportExcel}
            disabled={!analysis}
          >
            <Download className='mr-2 h-4 w-4' />
            Export Excel
          </Button>
          <Button
            variant='outline'
            onClick={handleExportPDF}
            disabled={!analysis}
          >
            <Download className='mr-2 h-4 w-4' />
            Export PDF
          </Button>
        </div>
      </div>

      <Card className='border-muted/60'>
        <CardContent className='p-4'>
          <div className='flex flex-wrap items-center gap-2'>
            {rangeOptions.map(option => (
              <button
                key={option.key}
                type='button'
                onClick={() => setRangeKey(option.key)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition',
                  rangeKey === option.key
                    ? 'bg-foreground text-background border-foreground'
                    : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {option.label}
              </button>
            ))}
            {rangeKey === 'custom' && (
              <div className='flex flex-wrap items-center gap-2'>
                <input
                  type='date'
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                  className='rounded-md border bg-background px-3 py-1.5 text-xs text-muted-foreground'
                />
                <span className='text-xs text-muted-foreground'>to</span>
                <input
                  type='date'
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                  className='rounded-md border bg-background px-3 py-1.5 text-xs text-muted-foreground'
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
              color='blue'
              trend={`${metrics?.uniqueBorrowers || 0} unique borrowers`}
              comparison={comparisonLabel}
            />
            <KPICard
              title='Total Disbursed'
              value={metrics?.totalDisbursed || 0}
              format={formatCurrency}
              icon={DollarSign}
              color='green'
              trend={`Avg: ${formatCurrency(metrics?.averageLoanSize || 0)}`}
              comparison={comparisonLabel}
            />
            <KPICard
              title='Outstanding Balance'
              value={metrics?.outstandingBalance || 0}
              format={formatCurrency}
              icon={Clock}
              color='orange'
              trend={`${(
                ((metrics?.outstandingBalance || 0) /
                  (metrics?.totalDisbursed || 1)) *
                100
              ).toFixed(1)}% of disbursed`}
              comparison={comparisonLabel}
            />
            <KPICard
              title='Problem Loans'
              value={metrics?.problemLoanBalance || 0}
              format={formatCurrency}
              icon={AlertCircle}
              color='red'
              trend={`${
                (metrics?.lateLoans || 0) +
                (metrics?.overdueLoans || 0) +
                (metrics?.defaultedLoans || 0)
              } loans`}
              comparison={comparisonLabel}
            />
          </>
        )}
      </div>

      {/* Charts Grid */}
      <div className='grid gap-4 lg:grid-cols-[2fr_1fr]'>
        <div className='space-y-4'>
          {/* Status Distribution */}
          <Card className='border-muted/60'>
            <CardHeader>
              <CardTitle>Loan Status Distribution</CardTitle>
              <CardDescription>Breakdown by loan status</CardDescription>
            </CardHeader>
            <CardContent>
              {analysisLoading ? (
                <Skeleton className='h-64' />
              ) : analysis?.statusDistribution &&
                analysis.statusDistribution.length > 0 ? (
                <ResponsiveContainer width='100%' height={300}>
                  <PieChart>
                    <Pie
                      data={analysis.statusDistribution}
                      dataKey='count'
                      nameKey='status'
                      cx='50%'
                      cy='50%'
                      outerRadius={100}
                      label={entry => `${entry.status}: ${entry.count}`}
                    >
                      {analysis.statusDistribution.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={value => formatNumber(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className='h-64 flex items-center justify-center text-muted-foreground'>
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vintage Performance */}
          <Card className='border-muted/60'>
            <CardHeader>
              <CardTitle>Monthly Cohort Performance</CardTitle>
              <CardDescription>
                Repayment percentage by month ({rangeLabel})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analysisLoading ? (
                <Skeleton className='h-64' />
              ) : cohortChartData.length > 0 ? (
                <CohortCanvasChart data={cohortChartData} />
              ) : (
                <div className='h-64 flex items-center justify-center text-muted-foreground'>
                  No cohort data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* DPD Distribution */}
          <Card className='border-muted/60'>
            <CardHeader>
              <CardTitle>Days Past Due Distribution</CardTitle>
              <CardDescription>Delinquency buckets</CardDescription>
            </CardHeader>
            <CardContent>
              {analysisLoading ? (
                <Skeleton className='h-64' />
              ) : analysis?.dpdBuckets && analysis.dpdBuckets.length > 0 ? (
                <ResponsiveContainer width='100%' height={300}>
                  <BarChart data={analysis.dpdBuckets} layout='vertical'>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis type='number' />
                    <YAxis dataKey='range' type='category' width={100} />
                    <Tooltip formatter={value => formatNumber(value as number)} />
                    <Bar dataKey='count' fill='#10b981' />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className='h-64 flex items-center justify-center text-muted-foreground'>
                  No DPD data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed */}
        <div className='space-y-4'>
          <ActivityFeed />
          <Card className='border-muted/60'>
            <CardHeader>
              <CardTitle>Range Summary</CardTitle>
              <CardDescription>{rangeLabel}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-xs text-muted-foreground'>
                {comparisonLabel}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
