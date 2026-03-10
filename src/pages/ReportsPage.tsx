import { motion } from 'framer-motion'
import { FileText, Download } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useLoanAnalysis, useCustomers } from '@/hooks/use-api'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

const reports = [
  {
    id: 'portfolio-summary',
    title: 'Portfolio Summary Report',
    description: 'Complete overview of loan portfolio with key metrics',
    icon: FileText,
  },
  {
    id: 'delinquency-report',
    title: 'Delinquency Report',
    description: 'Detailed analysis of overdue and defaulted loans',
    icon: FileText,
  },
  {
    id: 'customer-report',
    title: 'Customer Report',
    description: 'Customer list with loan history and balances',
    icon: FileText,
  },
  {
    id: 'vintage-analysis',
    title: 'Vintage Analysis',
    description: 'Monthly cohort performance and trends',
    icon: FileText,
  },
]

export function ReportsPage() {
  const { data: analysis } = useLoanAnalysis()
  const { data: customersResponse } = useCustomers()
  const customers = customersResponse?.docs ?? []

  const handleDownloadPDF = (reportId: string) => {
    const doc = new jsPDF()
    
    doc.setFontSize(18)
    doc.text('Loan Portfolio Report', 14, 20)
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)

    if (reportId === 'portfolio-summary' && analysis) {
      doc.setFontSize(14)
      doc.text('Portfolio Metrics', 14, 40)
      
      autoTable(doc, {
        startY: 45,
        head: [['Metric', 'Value']],
        body: [
          ['Total Loans', analysis.portfolioMetrics.totalLoans.toString()],
          ['Total Disbursed', `KES ${analysis.portfolioMetrics.totalDisbursed.toLocaleString()}`],
          ['Outstanding Balance', `KES ${analysis.portfolioMetrics.outstandingBalance.toLocaleString()}`],
          ['Repayment Rate', `${(analysis.portfolioMetrics.repaymentRate * 100).toFixed(1)}%`],
          ['Active Loans', analysis.portfolioMetrics.activeLoans.toString()],
          ['Problem Loans', analysis.portfolioMetrics.problemLoanBalance.toLocaleString()],
        ],
      })

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
            `KES ${s.disbursed.toLocaleString()}`,
            `KES ${s.outstanding.toLocaleString()}`
          ]),
        })
      }
    }

    if (reportId === 'customer-report' && customers) {
      autoTable(doc, {
        startY: 40,
        head: [['Name', 'ID Number', 'Total Loans', 'Total Borrowing', 'Disbursed Loans']],
        body: customers.map(c => [
          `${c.surname ?? ''} ${c.other_names ?? ''}`.trim(),
          c.id_no ?? 'N/A',
          String(c.total_outstanding_loans?.all_loans_count ?? 0),
          `KES ${(c.total_outstanding_loans?.total_borrowing ?? 0).toLocaleString()}`,
          String(c.total_outstanding_loans?.disbursed_loans_count ?? 0)
        ]),
      })
    }

    doc.save(`${reportId}-${new Date().toISOString().split('T')[0]}.pdf`)
    toast.success('Report downloaded successfully')
  }

  const handleDownloadExcel = (reportId: string) => {
    const wb = XLSX.utils.book_new()

    if (reportId === 'portfolio-summary' && analysis) {
      const metricsData = [
        ['Metric', 'Value'],
        ['Total Loans', analysis.portfolioMetrics.totalLoans],
        ['Total Disbursed', analysis.portfolioMetrics.totalDisbursed],
        ['Outstanding Balance', analysis.portfolioMetrics.outstandingBalance],
        ['Repayment Rate', (analysis.portfolioMetrics.repaymentRate * 100).toFixed(1) + '%'],
      ]
      const metricsWs = XLSX.utils.aoa_to_sheet(metricsData)
      XLSX.utils.book_append_sheet(wb, metricsWs, 'Metrics')

      if (analysis.statusDistribution) {
        const statusData = [
          ['Status', 'Count', 'Disbursed', 'Outstanding'],
          ...analysis.statusDistribution.map(s => [s.status, s.count, s.disbursed, s.outstanding])
        ]
        const statusWs = XLSX.utils.aoa_to_sheet(statusData)
        XLSX.utils.book_append_sheet(wb, statusWs, 'Status Distribution')
      }
    }

    if (reportId === 'customer-report' && customers) {
      const customerData = [
        ['Name', 'ID Number', 'Mobile', 'Total Loans', 'Total Borrowing', 'Disbursed Loans', 'Status'],
        ...customers.map(c => [
          `${c.surname ?? ''} ${c.other_names ?? ''}`.trim(),
          c.id_no ?? 'N/A',
          c.contact?.mobile ?? 'N/A',
          c.total_outstanding_loans?.all_loans_count ?? 0,
          c.total_outstanding_loans?.total_borrowing ?? 0,
          c.total_outstanding_loans?.disbursed_loans_count ?? 0,
          c.status
        ])
      ]
      const customerWs = XLSX.utils.aoa_to_sheet(customerData)
      XLSX.utils.book_append_sheet(wb, customerWs, 'Customers')
    }

    if (reportId === 'vintage-analysis' && analysis?.vintageCohorts) {
      const vintageData = [
        ['Month', 'Loan Count', 'Disbursed', 'Outstanding', 'Repayment %'],
        ...analysis.vintageCohorts.map(v => [
          v.month,
          v.loanCount,
          v.totalDisbursed,
          v.outstanding,
          v.repaymentPercentage
        ])
      ]
      const vintageWs = XLSX.utils.aoa_to_sheet(vintageData)
      XLSX.utils.book_append_sheet(wb, vintageWs, 'Vintage Analysis')
    }

    XLSX.writeFile(wb, `${reportId}-${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success('Report downloaded successfully')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-2">
          Download and export portfolio reports
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {reports.map((report, index) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <report.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{report.title}</CardTitle>
                      <CardDescription className="mt-1">{report.description}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDownloadPDF(report.id)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDownloadExcel(report.id)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
