import { useCompleteAnalysis, useLoanBook } from '@/hooks/use-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/utils'
import { Download, FileSpreadsheet, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

export function AnalysisPage () {
  const { data: loanBook, isLoading: bookLoading } = useLoanBook()
  const { data: analysis, isLoading: analysisLoading } = useCompleteAnalysis()

  const isLoading = bookLoading || analysisLoading
  const asOfDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const handleExportExcel = () => {
    if (!analysis) {
      toast.error('No data available to export')
      return
    }

    const wb = XLSX.utils.book_new()

    // Sheet 1: Executive Summary
    const sheet1Data = [
      ['EXECUTIVE SUMMARY'],
      ['Loan Portfolio Analysis'],
      [`As of ${asOfDate}`],
      [''],
      ['Portfolio Overview'],
      ['Total Loans', analysis.portfolioMetrics.totalLoans],
      ['Unique Borrowers', analysis.portfolioMetrics.uniqueBorrowers],
      ['Total Disbursed', analysis.portfolioMetrics.totalDisbursed],
      ['Outstanding Balance', analysis.portfolioMetrics.outstandingBalance],
      ['Principal Repaid', analysis.portfolioMetrics.principalRepaid],
      ['Total Interest', analysis.portfolioMetrics.totalInterest],
      ['Average Loan Size', analysis.portfolioMetrics.averageLoanSize],
      [
        'Repayment Rate',
        formatPercentage(analysis.portfolioMetrics.repaymentRate)
      ],
      [''],
      ['Portfolio Quality'],
      ['Active Loans', analysis.portfolioMetrics.activeLoans],
      ['Late Loans', analysis.portfolioMetrics.lateLoans],
      ['Overdue Loans', analysis.portfolioMetrics.overdueLoans],
      ['Defaulted Loans', analysis.portfolioMetrics.defaultedLoans],
      ['Problem Loan Balance', analysis.portfolioMetrics.problemLoanBalance]
    ]
    const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data)
    XLSX.utils.book_append_sheet(wb, ws1, 'Executive Summary')

    // Sheet 2: Full Loan Book
    if (loanBook && loanBook.length > 0) {
      const sheet2Data = [
        ['FULL LOAN BOOK'],
        [`As of ${asOfDate}`],
        [''],
        Object.keys(loanBook[0]),
        ...loanBook.map(loan => Object.values(loan))
      ]
      const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data)
      XLSX.utils.book_append_sheet(wb, ws2, 'Full Loan Book')
    }

    // Sheet 3: Portfolio Analysis
    const sheet3Data = [
      ['PORTFOLIO ANALYSIS'],
      [''],
      ['Status Distribution'],
      ['Status', 'Count', 'Disbursed', 'Outstanding'],
      ...analysis.statusDistribution.map(s => [
        s.status,
        s.count,
        s.disbursed,
        s.outstanding
      ]),
      [''],
      ['Loan Size Distribution'],
      ['Range', 'Count', '% of Total', 'Total Amount', '% of Amount'],
      ...analysis.loanSizeDistribution.map(s => [
        s.range,
        s.count,
        formatPercentage(s.percentage),
        s.totalAmount,
        formatPercentage(s.amountPercentage)
      ])
    ]
    const ws3 = XLSX.utils.aoa_to_sheet(sheet3Data)
    XLSX.utils.book_append_sheet(wb, ws3, 'Portfolio Analysis')

    // Sheet 4: Delinquency Analysis
    const sheet4Data = [
      ['DELINQUENCY ANALYSIS'],
      [''],
      ['DPD Buckets'],
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
        formatPercentage(b.percentage),
        b.outstanding,
        formatPercentage(b.balancePercentage),
        b.averageBalance
      ])
    ]
    const ws4 = XLSX.utils.aoa_to_sheet(sheet4Data)
    XLSX.utils.book_append_sheet(wb, ws4, 'Delinquency Analysis')

    // Sheet 5: PAR Analysis
    const sheet5Data = [
      ['PAR ANALYSIS'],
      [''],
      ['Portfolio at Risk Metrics'],
      ['Metric', 'Value'],
      ['PAR 1 Day', formatPercentage(analysis.parMetrics.par1)],
      ['PAR 7 Days', formatPercentage(analysis.parMetrics.par7)],
      ['PAR 30 Days', formatPercentage(analysis.parMetrics.par30)],
      ['PAR 60 Days', formatPercentage(analysis.parMetrics.par60)],
      ['PAR 90 Days', formatPercentage(analysis.parMetrics.par90)],
      ['Collection Rate', formatPercentage(analysis.parMetrics.collectionRate)],
      [
        'Delinquency Rate',
        formatPercentage(analysis.parMetrics.delinquencyRate)
      ]
    ]
    const ws5 = XLSX.utils.aoa_to_sheet(sheet5Data)
    XLSX.utils.book_append_sheet(wb, ws5, 'PAR Analysis')

    // Sheet 6: Vintage Analysis
    const sheet6Data = [
      ['VINTAGE ANALYSIS'],
      [''],
      ['Monthly Cohorts'],
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
        formatPercentage(v.repaymentPercentage)
      ])
    ]
    const ws6 = XLSX.utils.aoa_to_sheet(sheet6Data)
    XLSX.utils.book_append_sheet(wb, ws6, 'Vintage Analysis')

    // Sheet 7: Risk Metrics
    const sheet7Data = [
      ['RISK METRICS'],
      [''],
      ['Key Risk Ratios'],
      ['Metric', 'Value'],
      [
        'Portfolio Outstanding Ratio',
        formatPercentage(analysis.riskMetrics.portfolioOutstandingRatio)
      ],
      [
        'Collection Efficiency',
        formatPercentage(analysis.riskMetrics.collectionEfficiency)
      ],
      ['PAR 30 Ratio', formatPercentage(analysis.riskMetrics.par30Ratio)],
      [
        'Delinquency Rate',
        formatPercentage(analysis.riskMetrics.delinquencyRate)
      ],
      ['Default Rate', formatPercentage(analysis.riskMetrics.defaultRate)],
      ['Avg Days Past Due', analysis.riskMetrics.avgDaysPastDue.toFixed(1)],
      [''],
      ['Loss Provisions'],
      ['DPD Range', 'Provision Rate', 'Amount'],
      ['1-30 Days', '5%', analysis.riskMetrics.provisions.provision_1_30],
      ['31-60 Days', '25%', analysis.riskMetrics.provisions.provision_31_60],
      ['61-90 Days', '50%', analysis.riskMetrics.provisions.provision_61_90],
      ['90+ Days', '100%', analysis.riskMetrics.provisions.provision_90_plus],
      ['Total Provisions', '', analysis.riskMetrics.totalProvisions]
    ]
    const ws7 = XLSX.utils.aoa_to_sheet(sheet7Data)
    XLSX.utils.book_append_sheet(wb, ws7, 'Risk Metrics')

    // Sheet 8: Financial Performance
    const sheet8Data = [
      ['FINANCIAL PERFORMANCE'],
      [''],
      ['Revenue Analysis'],
      ['Metric', 'Amount'],
      ['Interest Income', analysis.financialPerformance.interestIncome],
      ['Late Fee Income', analysis.financialPerformance.lateFeeIncome],
      ['Cashback Paid', -analysis.financialPerformance.cashbackPaid],
      ['Net Revenue', analysis.financialPerformance.netRevenue],
      ['Avg Revenue per Loan', analysis.financialPerformance.avgRevenuePerLoan],
      [
        'Revenue Yield',
        formatPercentage(analysis.financialPerformance.revenueYield)
      ],
      [''],
      ['Portfolio Performance'],
      ['Total Disbursed', analysis.financialPerformance.totalDisbursed],
      ['Total Outstanding', analysis.financialPerformance.totalOutstanding],
      ['Total Repaid', analysis.financialPerformance.totalRepaid],
      [
        'Portfolio Turnover',
        formatPercentage(analysis.financialPerformance.portfolioTurnover)
      ],
      [''],
      ['Repayment by Status'],
      ['Status', 'Count', 'Disbursed', 'Repaid', 'Repayment %'],
      ...analysis.financialPerformance.repaymentByStatus.map(r => [
        r.status,
        r.count,
        r.disbursed,
        r.repaid,
        formatPercentage(r.repaymentPercentage)
      ])
    ]
    const ws8 = XLSX.utils.aoa_to_sheet(sheet8Data)
    XLSX.utils.book_append_sheet(wb, ws8, 'Financial Performance')

    XLSX.writeFile(
      wb,
      `loan-analysis-8-sheets-${new Date().toISOString().split('T')[0]}.xlsx`
    )
    toast.success('Excel workbook with 8 sheets downloaded successfully!')
  }

  if (isLoading) {
    return (
      <div className='space-y-6 p-6'>
        <Skeleton className='h-12 w-96' />
        <Skeleton className='h-[600px]' />
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className='flex items-center justify-center min-h-[600px]'>
        <div className='text-center space-y-4'>
          <AlertCircle className='h-12 w-12 text-muted-foreground mx-auto' />
          <h3 className='text-lg font-semibold'>No Data Available</h3>
          <p className='text-sm text-muted-foreground max-w-md'>
            Please ensure your API endpoint is configured and returning loan
            book data.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Loan Portfolio Analysis
          </h1>
          <p className='text-muted-foreground mt-2'>
            8-Sheet Analysis Report • As of {asOfDate}
          </p>
        </div>
        <Button onClick={handleExportExcel} size='lg'>
          <Download className='mr-2 h-5 w-5' />
          Download Excel (8 Sheets)
        </Button>
      </div>

      {/* 8-Sheet Tabs */}
      <Tabs defaultValue='sheet1' className='space-y-4'>
        <TabsList className='grid w-full grid-cols-4 lg:grid-cols-8'>
          <TabsTrigger value='sheet1'>1. Summary</TabsTrigger>
          <TabsTrigger value='sheet2'>2. Loan Book</TabsTrigger>
          <TabsTrigger value='sheet3'>3. Portfolio</TabsTrigger>
          <TabsTrigger value='sheet4'>4. Delinquency</TabsTrigger>
          <TabsTrigger value='sheet5'>5. PAR</TabsTrigger>
          <TabsTrigger value='sheet6'>6. Vintage</TabsTrigger>
          <TabsTrigger value='sheet7'>7. Risk</TabsTrigger>
          <TabsTrigger value='sheet8'>8. Financial</TabsTrigger>
        </TabsList>

        {/* Sheet 1: Executive Summary */}
        <TabsContent value='sheet1'>
          <Card>
            <CardHeader className='border-b bg-muted/50'>
              <CardTitle className='flex items-center gap-2'>
                <FileSpreadsheet className='h-5 w-5' />
                Sheet 1: Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent className='p-0'>
              <div className='divide-y'>
                {/* Header */}
                <div className='bg-blue-50 dark:bg-blue-950 p-6'>
                  <h2 className='text-2xl font-bold'>EXECUTIVE SUMMARY</h2>
                  <p className='text-sm text-muted-foreground mt-1'>
                    Loan Portfolio Analysis
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    As of {asOfDate}
                  </p>
                </div>

                {/* Portfolio Overview */}
                <div className='p-6'>
                  <h3 className='font-semibold text-lg mb-4'>
                    Portfolio Overview
                  </h3>
                  <div className='space-y-0'>
                    <table className='w-full'>
                      <tbody className='divide-y'>
                        <tr className='hover:bg-muted/50'>
                          <td className='py-2 font-medium'>Total Loans</td>
                          <td className='py-2 text-right font-numbers'>
                            {formatNumber(analysis.portfolioMetrics.totalLoans)}
                          </td>
                        </tr>
                        <tr className='hover:bg-muted/50'>
                          <td className='py-2 font-medium'>Unique Borrowers</td>
                          <td className='py-2 text-right font-numbers'>
                            {formatNumber(
                              analysis.portfolioMetrics.uniqueBorrowers
                            )}
                          </td>
                        </tr>
                        <tr className='hover:bg-muted/50'>
                          <td className='py-2 font-medium'>Total Disbursed</td>
                          <td className='py-2 text-right font-numbers font-semibold'>
                            {formatCurrency(
                              analysis.portfolioMetrics.totalDisbursed
                            )}
                          </td>
                        </tr>
                        <tr className='hover:bg-muted/50'>
                          <td className='py-2 font-medium'>
                            Outstanding Balance
                          </td>
                          <td className='py-2 text-right font-numbers font-semibold'>
                            {formatCurrency(
                              analysis.portfolioMetrics.outstandingBalance
                            )}
                          </td>
                        </tr>
                        <tr className='hover:bg-muted/50'>
                          <td className='py-2 font-medium'>Principal Repaid</td>
                          <td className='py-2 text-right font-numbers'>
                            {formatCurrency(
                              analysis.portfolioMetrics.principalRepaid
                            )}
                          </td>
                        </tr>
                        <tr className='hover:bg-muted/50'>
                          <td className='py-2 font-medium'>Total Interest</td>
                          <td className='py-2 text-right font-numbers'>
                            {formatCurrency(
                              analysis.portfolioMetrics.totalInterest
                            )}
                          </td>
                        </tr>
                        <tr className='hover:bg-muted/50'>
                          <td className='py-2 font-medium'>
                            Average Loan Size
                          </td>
                          <td className='py-2 text-right font-numbers'>
                            {formatCurrency(
                              analysis.portfolioMetrics.averageLoanSize
                            )}
                          </td>
                        </tr>
                        <tr className='hover:bg-muted/50 bg-green-50 dark:bg-green-950'>
                          <td className='py-2 font-medium'>Repayment Rate</td>
                          <td className='py-2 text-right font-numbers font-semibold text-green-600 dark:text-green-400'>
                            {formatPercentage(
                              analysis.portfolioMetrics.repaymentRate
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Portfolio Quality */}
                <div className='p-6'>
                  <h3 className='font-semibold text-lg mb-4'>
                    Portfolio Quality
                  </h3>
                  <div className='space-y-0'>
                    <table className='w-full'>
                      <tbody className='divide-y'>
                        <tr className='hover:bg-muted/50'>
                          <td className='py-2 font-medium'>Active Loans</td>
                          <td className='py-2 text-right font-numbers'>
                            {formatNumber(
                              analysis.portfolioMetrics.activeLoans
                            )}
                          </td>
                        </tr>
                        <tr className='hover:bg-muted/50 bg-orange-50 dark:bg-orange-950'>
                          <td className='py-2 font-medium'>Late Loans</td>
                          <td className='py-2 text-right font-numbers font-semibold text-orange-600 dark:text-orange-400'>
                            {formatNumber(analysis.portfolioMetrics.lateLoans)}
                          </td>
                        </tr>
                        <tr className='hover:bg-muted/50 bg-red-50 dark:bg-red-950'>
                          <td className='py-2 font-medium'>Overdue Loans</td>
                          <td className='py-2 text-right font-numbers font-semibold text-red-600 dark:text-red-400'>
                            {formatNumber(
                              analysis.portfolioMetrics.overdueLoans
                            )}
                          </td>
                        </tr>
                        <tr className='hover:bg-muted/50 bg-red-100 dark:bg-red-900'>
                          <td className='py-2 font-medium'>Defaulted Loans</td>
                          <td className='py-2 text-right font-numbers font-semibold text-red-800 dark:text-red-300'>
                            {formatNumber(
                              analysis.portfolioMetrics.defaultedLoans
                            )}
                          </td>
                        </tr>
                        <tr className='hover:bg-muted/50 bg-red-100 dark:bg-red-900'>
                          <td className='py-2 font-medium'>
                            Problem Loan Balance
                          </td>
                          <td className='py-2 text-right font-numbers font-bold text-red-800 dark:text-red-300'>
                            {formatCurrency(
                              analysis.portfolioMetrics.problemLoanBalance
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sheet 2: Full Loan Book */}
        <TabsContent value='sheet2'>
          <Card>
            <CardHeader className='border-b bg-muted/50'>
              <CardTitle className='flex items-center gap-2'>
                <FileSpreadsheet className='h-5 w-5' />
                Sheet 2: Full Loan Book
              </CardTitle>
            </CardHeader>
            <CardContent className='p-6'>
              {loanBook && loanBook.length > 0 ? (
                <div className='overflow-x-auto'>
                  <div className='mb-4 text-sm text-muted-foreground'>
                    Showing {loanBook.length} loan records
                  </div>
                  <table className='w-full text-sm border'>
                    <thead>
                      <tr className='bg-muted'>
                        {Object.keys(loanBook[0]).map(key => (
                          <th
                            key={key}
                            className='border px-3 py-2 text-left font-semibold whitespace-nowrap'
                          >
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className='divide-y'>
                      {loanBook.slice(0, 50).map((loan, idx) => (
                        <tr key={idx} className='hover:bg-muted/50'>
                          {Object.values(loan).map((value, vidx) => (
                            <td
                              key={vidx}
                              className='border px-3 py-2 whitespace-nowrap'
                            >
                              {typeof value === 'number'
                                ? formatNumber(value)
                                : String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {loanBook.length > 50 && (
                    <p className='text-sm text-muted-foreground mt-4'>
                      Showing first 50 of {loanBook.length} records. Download
                      Excel for complete data.
                    </p>
                  )}
                </div>
              ) : (
                <p className='text-muted-foreground'>
                  No loan book data available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sheet 3: Portfolio Analysis */}
        <TabsContent value='sheet3'>
          <Card>
            <CardHeader className='border-b bg-muted/50'>
              <CardTitle className='flex items-center gap-2'>
                <FileSpreadsheet className='h-5 w-5' />
                Sheet 3: Portfolio Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className='p-0'>
              <div className='divide-y'>
                {/* Status Distribution */}
                <div className='p-6'>
                  <h3 className='font-semibold text-lg mb-4'>
                    Status Distribution
                  </h3>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b'>
                        <th className='py-2 text-left font-semibold'>Status</th>
                        <th className='py-2 text-right font-semibold'>Count</th>
                        <th className='py-2 text-right font-semibold'>
                          Disbursed
                        </th>
                        <th className='py-2 text-right font-semibold'>
                          Outstanding
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y'>
                      {analysis.statusDistribution.map((status, idx) => (
                        <tr key={idx} className='hover:bg-muted/50'>
                          <td className='py-2 capitalize'>{status.status}</td>
                          <td className='py-2 text-right font-numbers'>
                            {status.count}
                          </td>
                          <td className='py-2 text-right font-numbers'>
                            {formatCurrency(status.disbursed)}
                          </td>
                          <td className='py-2 text-right font-numbers'>
                            {formatCurrency(status.outstanding)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Loan Size Distribution */}
                <div className='p-6'>
                  <h3 className='font-semibold text-lg mb-4'>
                    Loan Size Distribution
                  </h3>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b'>
                        <th className='py-2 text-left font-semibold'>Range</th>
                        <th className='py-2 text-right font-semibold'>Count</th>
                        <th className='py-2 text-right font-semibold'>
                          % of Total
                        </th>
                        <th className='py-2 text-right font-semibold'>
                          Total Amount
                        </th>
                        <th className='py-2 text-right font-semibold'>
                          % of Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y'>
                      {analysis.loanSizeDistribution.map((size, idx) => (
                        <tr key={idx} className='hover:bg-muted/50'>
                          <td className='py-2'>{size.range}</td>
                          <td className='py-2 text-right font-numbers'>
                            {size.count}
                          </td>
                          <td className='py-2 text-right font-numbers'>
                            {formatPercentage(size.percentage)}
                          </td>
                          <td className='py-2 text-right font-numbers'>
                            {formatCurrency(size.totalAmount)}
                          </td>
                          <td className='py-2 text-right font-numbers'>
                            {formatPercentage(size.amountPercentage)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sheet 4: Delinquency Analysis */}
        <TabsContent value='sheet4'>
          <Card>
            <CardHeader className='border-b bg-muted/50'>
              <CardTitle className='flex items-center gap-2'>
                <FileSpreadsheet className='h-5 w-5' />
                Sheet 4: Delinquency Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className='p-6'>
              <h3 className='font-semibold text-lg mb-4'>DPD Buckets</h3>
              <table className='w-full'>
                <thead>
                  <tr className='border-b'>
                    <th className='py-2 text-left font-semibold'>Range</th>
                    <th className='py-2 text-right font-semibold'>Count</th>
                    <th className='py-2 text-right font-semibold'>
                      % of Total
                    </th>
                    <th className='py-2 text-right font-semibold'>
                      Outstanding
                    </th>
                    <th className='py-2 text-right font-semibold'>
                      % of Balance
                    </th>
                    <th className='py-2 text-right font-semibold'>
                      Avg Balance
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y'>
                  {analysis.dpdBuckets.map((bucket, idx) => {
                    const isCurrent = bucket.range === 'Current (0)'
                    const isWarning = bucket.range.includes('8-30')
                    const isDanger =
                      bucket.range.includes('31-') ||
                      bucket.range.includes('90+')

                    return (
                      <tr
                        key={idx}
                        className={`hover:bg-muted/50 ${
                          isCurrent
                            ? 'bg-green-50 dark:bg-green-950'
                            : isWarning
                            ? 'bg-yellow-50 dark:bg-yellow-950'
                            : isDanger
                            ? 'bg-red-50 dark:bg-red-950'
                            : ''
                        }`}
                      >
                        <td className='py-2 font-medium'>{bucket.range}</td>
                        <td className='py-2 text-right font-numbers'>
                          {bucket.count}
                        </td>
                        <td className='py-2 text-right font-numbers'>
                          {formatPercentage(bucket.percentage)}
                        </td>
                        <td className='py-2 text-right font-numbers'>
                          {formatCurrency(bucket.outstanding)}
                        </td>
                        <td className='py-2 text-right font-numbers'>
                          {formatPercentage(bucket.balancePercentage)}
                        </td>
                        <td className='py-2 text-right font-numbers'>
                          {formatCurrency(bucket.averageBalance)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sheet 5: PAR Analysis */}
        <TabsContent value='sheet5'>
          <Card>
            <CardHeader className='border-b bg-muted/50'>
              <CardTitle className='flex items-center gap-2'>
                <FileSpreadsheet className='h-5 w-5' />
                Sheet 5: PAR Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className='p-6'>
              <h3 className='font-semibold text-lg mb-4'>
                Portfolio at Risk Metrics
              </h3>
              <table className='w-full'>
                <thead>
                  <tr className='border-b'>
                    <th className='py-2 text-left font-semibold'>Metric</th>
                    <th className='py-2 text-right font-semibold'>Value</th>
                  </tr>
                </thead>
                <tbody className='divide-y'>
                  <tr className='hover:bg-muted/50'>
                    <td className='py-2 font-medium'>PAR 1 Day</td>
                    <td className='py-2 text-right font-numbers'>
                      {formatPercentage(analysis.parMetrics.par1)}
                    </td>
                  </tr>
                  <tr className='hover:bg-muted/50'>
                    <td className='py-2 font-medium'>PAR 7 Days</td>
                    <td className='py-2 text-right font-numbers'>
                      {formatPercentage(analysis.parMetrics.par7)}
                    </td>
                  </tr>
                  <tr className='hover:bg-muted/50 bg-yellow-50 dark:bg-yellow-950'>
                    <td className='py-2 font-medium'>PAR 30 Days</td>
                    <td className='py-2 text-right font-numbers font-semibold text-orange-600 dark:text-orange-400'>
                      {formatPercentage(analysis.parMetrics.par30)}
                    </td>
                  </tr>
                  <tr className='hover:bg-muted/50 bg-orange-50 dark:bg-orange-950'>
                    <td className='py-2 font-medium'>PAR 60 Days</td>
                    <td className='py-2 text-right font-numbers font-semibold text-red-600 dark:text-red-400'>
                      {formatPercentage(analysis.parMetrics.par60)}
                    </td>
                  </tr>
                  <tr className='hover:bg-muted/50 bg-red-50 dark:bg-red-950'>
                    <td className='py-2 font-medium'>PAR 90 Days</td>
                    <td className='py-2 text-right font-numbers font-bold text-red-800 dark:text-red-300'>
                      {formatPercentage(analysis.parMetrics.par90)}
                    </td>
                  </tr>
                  <tr className='hover:bg-muted/50 border-t-2'>
                    <td className='py-2 font-medium'>Collection Rate</td>
                    <td className='py-2 text-right font-numbers font-semibold text-green-600 dark:text-green-400'>
                      {formatPercentage(analysis.parMetrics.collectionRate)}
                    </td>
                  </tr>
                  <tr className='hover:bg-muted/50'>
                    <td className='py-2 font-medium'>Delinquency Rate</td>
                    <td className='py-2 text-right font-numbers font-semibold text-red-600 dark:text-red-400'>
                      {formatPercentage(analysis.parMetrics.delinquencyRate)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sheet 6: Vintage Analysis */}
        <TabsContent value='sheet6'>
          <Card>
            <CardHeader className='border-b bg-muted/50'>
              <CardTitle className='flex items-center gap-2'>
                <FileSpreadsheet className='h-5 w-5' />
                Sheet 6: Vintage Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className='p-6'>
              <h3 className='font-semibold text-lg mb-4'>Monthly Cohorts</h3>
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b'>
                      <th className='py-2 text-left font-semibold'>Month</th>
                      <th className='py-2 text-right font-semibold'>
                        Loan Count
                      </th>
                      <th className='py-2 text-right font-semibold'>
                        Total Disbursed
                      </th>
                      <th className='py-2 text-right font-semibold'>
                        Avg Loan Size
                      </th>
                      <th className='py-2 text-right font-semibold'>
                        Outstanding
                      </th>
                      <th className='py-2 text-right font-semibold'>Repaid</th>
                      <th className='py-2 text-right font-semibold'>
                        Repayment %
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y'>
                    {analysis.vintageCohorts.map((cohort, idx) => (
                      <tr key={idx} className='hover:bg-muted/50'>
                        <td className='py-2 font-medium'>{cohort.month}</td>
                        <td className='py-2 text-right font-numbers'>
                          {cohort.loanCount}
                        </td>
                        <td className='py-2 text-right font-numbers'>
                          {formatCurrency(cohort.totalDisbursed)}
                        </td>
                        <td className='py-2 text-right font-numbers'>
                          {formatCurrency(cohort.averageLoanSize)}
                        </td>
                        <td className='py-2 text-right font-numbers'>
                          {formatCurrency(cohort.outstanding)}
                        </td>
                        <td className='py-2 text-right font-numbers'>
                          {formatCurrency(cohort.repaid)}
                        </td>
                        <td className='py-2 text-right font-numbers font-semibold'>
                          <span
                            className={
                              cohort.repaymentPercentage >= 0.8
                                ? 'text-green-600 dark:text-green-400'
                                : cohort.repaymentPercentage >= 0.5
                                ? 'text-orange-600 dark:text-orange-400'
                                : 'text-red-600 dark:text-red-400'
                            }
                          >
                            {formatPercentage(cohort.repaymentPercentage)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sheet 7: Risk Metrics */}
        <TabsContent value='sheet7'>
          <Card>
            <CardHeader className='border-b bg-muted/50'>
              <CardTitle className='flex items-center gap-2'>
                <FileSpreadsheet className='h-5 w-5' />
                Sheet 7: Risk Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className='p-0'>
              <div className='divide-y'>
                {/* Key Risk Ratios */}
                <div className='p-6'>
                  <h3 className='font-semibold text-lg mb-4'>
                    Key Risk Ratios
                  </h3>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b'>
                        <th className='py-2 text-left font-semibold'>Metric</th>
                        <th className='py-2 text-right font-semibold'>Value</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y'>
                      <tr className='hover:bg-muted/50'>
                        <td className='py-2 font-medium'>
                          Portfolio Outstanding Ratio
                        </td>
                        <td className='py-2 text-right font-numbers'>
                          {formatPercentage(
                            analysis.riskMetrics.portfolioOutstandingRatio
                          )}
                        </td>
                      </tr>
                      <tr className='hover:bg-muted/50'>
                        <td className='py-2 font-medium'>
                          Collection Efficiency
                        </td>
                        <td className='py-2 text-right font-numbers'>
                          {formatPercentage(
                            analysis.riskMetrics.collectionEfficiency
                          )}
                        </td>
                      </tr>
                      <tr className='hover:bg-muted/50'>
                        <td className='py-2 font-medium'>PAR 30 Ratio</td>
                        <td className='py-2 text-right font-numbers'>
                          {formatPercentage(analysis.riskMetrics.par30Ratio)}
                        </td>
                      </tr>
                      <tr className='hover:bg-muted/50'>
                        <td className='py-2 font-medium'>Delinquency Rate</td>
                        <td className='py-2 text-right font-numbers text-red-600 dark:text-red-400'>
                          {formatPercentage(
                            analysis.riskMetrics.delinquencyRate
                          )}
                        </td>
                      </tr>
                      <tr className='hover:bg-muted/50'>
                        <td className='py-2 font-medium'>Default Rate</td>
                        <td className='py-2 text-right font-numbers text-red-800 dark:text-red-300'>
                          {formatPercentage(analysis.riskMetrics.defaultRate)}
                        </td>
                      </tr>
                      <tr className='hover:bg-muted/50'>
                        <td className='py-2 font-medium'>Avg Days Past Due</td>
                        <td className='py-2 text-right font-numbers'>
                          {analysis.riskMetrics.avgDaysPastDue.toFixed(1)} days
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Loss Provisions */}
                <div className='p-6'>
                  <h3 className='font-semibold text-lg mb-4'>
                    Loss Provisions
                  </h3>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b'>
                        <th className='py-2 text-left font-semibold'>
                          DPD Range
                        </th>
                        <th className='py-2 text-center font-semibold'>
                          Provision Rate
                        </th>
                        <th className='py-2 text-right font-semibold'>
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y'>
                      <tr className='hover:bg-muted/50 bg-yellow-50 dark:bg-yellow-950'>
                        <td className='py-2 font-medium'>1-30 Days</td>
                        <td className='py-2 text-center font-numbers'>5%</td>
                        <td className='py-2 text-right font-numbers'>
                          {formatCurrency(
                            analysis.riskMetrics.provisions.provision_1_30
                          )}
                        </td>
                      </tr>
                      <tr className='hover:bg-muted/50 bg-orange-50 dark:bg-orange-950'>
                        <td className='py-2 font-medium'>31-60 Days</td>
                        <td className='py-2 text-center font-numbers'>25%</td>
                        <td className='py-2 text-right font-numbers'>
                          {formatCurrency(
                            analysis.riskMetrics.provisions.provision_31_60
                          )}
                        </td>
                      </tr>
                      <tr className='hover:bg-muted/50 bg-red-50 dark:bg-red-950'>
                        <td className='py-2 font-medium'>61-90 Days</td>
                        <td className='py-2 text-center font-numbers'>50%</td>
                        <td className='py-2 text-right font-numbers'>
                          {formatCurrency(
                            analysis.riskMetrics.provisions.provision_61_90
                          )}
                        </td>
                      </tr>
                      <tr className='hover:bg-muted/50 bg-red-100 dark:bg-red-900'>
                        <td className='py-2 font-medium'>90+ Days</td>
                        <td className='py-2 text-center font-numbers'>100%</td>
                        <td className='py-2 text-right font-numbers'>
                          {formatCurrency(
                            analysis.riskMetrics.provisions.provision_90_plus
                          )}
                        </td>
                      </tr>
                      <tr className='bg-red-100 dark:bg-red-900 font-bold border-t-2'>
                        <td className='py-3 font-bold' colSpan={2}>
                          Total Provisions
                        </td>
                        <td className='py-3 text-right font-numbers text-red-800 dark:text-red-300'>
                          {formatCurrency(analysis.riskMetrics.totalProvisions)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sheet 8: Financial Performance */}
        <TabsContent value='sheet8'>
          <Card>
            <CardHeader className='border-b bg-muted/50'>
              <CardTitle className='flex items-center gap-2'>
                <FileSpreadsheet className='h-5 w-5' />
                Sheet 8: Financial Performance
              </CardTitle>
            </CardHeader>
            <CardContent className='p-0'>
              <div className='divide-y'>
                {/* Revenue Analysis */}
                <div className='p-6'>
                  <h3 className='font-semibold text-lg mb-4'>
                    Revenue Analysis
                  </h3>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b'>
                        <th className='py-2 text-left font-semibold'>Metric</th>
                        <th className='py-2 text-right font-semibold'>
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y'>
                      <tr className='hover:bg-muted/50'>
                        <td className='py-2 font-medium'>Interest Income</td>
                        <td className='py-2 text-right font-numbers text-green-600 dark:text-green-400'>
                          {formatCurrency(
                            analysis.financialPerformance.interestIncome
                          )}
                        </td>
                      </tr>
                      <tr className='hover:bg-muted/50'>
                        <td className='py-2 font-medium'>Late Fee Income</td>
                        <td className='py-2 text-right font-numbers text-green-600 dark:text-green-400'>
                          {formatCurrency(
                            analysis.financialPerformance.lateFeeIncome
                          )}
                        </td>
                      </tr>
                      <tr className='hover:bg-muted/50'>
                        <td className='py-2 font-medium'>Cashback Paid</td>
                        <td className='py-2 text-right font-numbers text-red-600 dark:text-red-400'>
                          -
                          {formatCurrency(
                            analysis.financialPerformance.cashbackPaid
                          )}
                        </td>
                      </tr>
                      <tr className='hover:bg-muted/50 bg-green-50 dark:bg-green-950 border-t-2'>
                        <td className='py-2 font-bold'>Net Revenue</td>
                        <td className='py-2 text-right font-numbers font-bold text-green-700 dark:text-green-300'>
                          {formatCurrency(
                            analysis.financialPerformance.netRevenue
                          )}
                        </td>
                      </tr>
                      <tr className='hover:bg-muted/50'>
                        <td className='py-2 font-medium'>
                          Avg Revenue per Loan
                        </td>
                        <td className='py-2 text-right font-numbers'>
                          {formatCurrency(
                            analysis.financialPerformance.avgRevenuePerLoan
                          )}
                        </td>
                      </tr>
                      <tr className='hover:bg-muted/50'>
                        <td className='py-2 font-medium'>Revenue Yield</td>
                        <td className='py-2 text-right font-numbers'>
                          {formatPercentage(
                            analysis.financialPerformance.revenueYield
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Portfolio Performance */}
                <div className='p-6'>
                  <h3 className='font-semibold text-lg mb-4'>
                    Portfolio Performance
                  </h3>
                  <table className='w-full'>
                    <tbody className='divide-y'>
                      <tr className='hover:bg-muted/50'>
                        <td className='py-2 font-medium'>Total Disbursed</td>
                        <td className='py-2 text-right font-numbers'>
                          {formatCurrency(
                            analysis.financialPerformance.totalDisbursed
                          )}
                        </td>
                      </tr>
                      <tr className='hover:bg-muted/50'>
                        <td className='py-2 font-medium'>Total Outstanding</td>
                        <td className='py-2 text-right font-numbers text-orange-600 dark:text-orange-400'>
                          {formatCurrency(
                            analysis.financialPerformance.totalOutstanding
                          )}
                        </td>
                      </tr>
                      <tr className='hover:bg-muted/50'>
                        <td className='py-2 font-medium'>Total Repaid</td>
                        <td className='py-2 text-right font-numbers text-green-600 dark:text-green-400'>
                          {formatCurrency(
                            analysis.financialPerformance.totalRepaid
                          )}
                        </td>
                      </tr>
                      <tr className='hover:bg-muted/50 bg-blue-50 dark:bg-blue-950'>
                        <td className='py-2 font-bold'>Portfolio Turnover</td>
                        <td className='py-2 text-right font-numbers font-bold'>
                          {formatPercentage(
                            analysis.financialPerformance.portfolioTurnover
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Repayment by Status */}
                <div className='p-6'>
                  <h3 className='font-semibold text-lg mb-4'>
                    Repayment by Status
                  </h3>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='border-b'>
                        <th className='py-2 text-left font-semibold'>Status</th>
                        <th className='py-2 text-right font-semibold'>Count</th>
                        <th className='py-2 text-right font-semibold'>
                          Disbursed
                        </th>
                        <th className='py-2 text-right font-semibold'>
                          Repaid
                        </th>
                        <th className='py-2 text-right font-semibold'>
                          Repayment %
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y'>
                      {analysis.financialPerformance.repaymentByStatus.map(
                        (status, idx) => (
                          <tr key={idx} className='hover:bg-muted/50'>
                            <td className='py-2 capitalize'>{status.status}</td>
                            <td className='py-2 text-right font-numbers'>
                              {status.count}
                            </td>
                            <td className='py-2 text-right font-numbers'>
                              {formatCurrency(status.disbursed)}
                            </td>
                            <td className='py-2 text-right font-numbers'>
                              {formatCurrency(status.repaid)}
                            </td>
                            <td className='py-2 text-right font-numbers'>
                              <span
                                className={
                                  status.repaymentPercentage >= 0.8
                                    ? 'text-green-600 dark:text-green-400'
                                    : status.repaymentPercentage >= 0.5
                                    ? 'text-orange-600 dark:text-orange-400'
                                    : 'text-red-600 dark:text-red-400'
                                }
                              >
                                {formatPercentage(status.repaymentPercentage)}
                              </span>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
