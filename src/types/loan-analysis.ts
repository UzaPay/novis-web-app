import Papa from 'papaparse'
import { format, parseISO } from 'date-fns'

interface RawLoanData {
  'Application Date': string
  'Loan Type': string
  'Tenor': string
  'Customer Name': string
  'Mobile Number': string
  'ID Number': string
  'Loan Amount': string
  'Interest Amount': string
  'Current Balance': string
  'Late Fee Applied?': string
  'Late Fee Amount': string
  'Cashback Amount': string
  'Loan Status': string
  'Due Date': string
  'DPD <7 Days': string
  'DPD <30 Days': string
  'DPD <60 Days': string
  'DPD <90 Days': string
}

export interface PortfolioMetrics {
  totalLoans: number
  totalDisbursed: number
  totalInterest: number
  outstandingBalance: number
  principalRepaid: number
  averageLoanSize: number
  uniqueBorrowers: number
  repaymentRate: number
  activeLoans: number
  lateLoans: number
  overdueLoans: number
  defaultedLoans: number
  problemLoanBalance: number
}

export interface StatusDistribution {
  status: string
  count: number
  percentage: number
  disbursed: number
  outstanding: number
}

export interface LoanSizeDistribution {
  range: string
  count: number
  percentage: number
  totalAmount: number
  amountPercentage: number
}

export interface DPDBucket {
  range: string
  count: number
  percentage: number
  outstanding: number
  balancePercentage: number
  averageBalance: number
}

export interface VintageCohort {
  month: string
  loanCount: number
  totalDisbursed: number
  averageLoanSize: number
  outstanding: number
  repaid: number
  repaymentPercentage: number
}

export interface PARMetrics {
  par1: { balance: number; percentage: number; count: number }
  par7: { balance: number; percentage: number; count: number }
  par30: { balance: number; percentage: number; count: number }
  par60: { balance: number; percentage: number; count: number }
  par90: { balance: number; percentage: number; count: number }
}

export interface RiskMetrics {
  portfolioOutstandingRatio: number
  collectionEfficiency: number
  par30Ratio: number
  delinquencyRate: number
  defaultRate: number
  avgDaysPastDue: number
  lossProvisions: {
    '1-30': { balance: number; rate: number; provision: number }
    '31-60': { balance: number; rate: number; provision: number }
    '61-90': { balance: number; rate: number; provision: number }
    '90+': { balance: number; rate: number; provision: number }
    total: number
  }
}

export interface FinancialPerformance {
  interestIncome: number
  lateFeeIncome: number
  cashbackPaid: number
  netRevenue: number
  avgRevenuePerLoan: number
  revenueYield: number
  portfolioTurnover: number
  activePortfolio: number
}

export interface LoanAnalysisComplete {
  metrics: PortfolioMetrics
  statusDistribution: StatusDistribution[]
  loanSizeDistribution: LoanSizeDistribution[]
  dpdBuckets: DPDBucket[]
  vintageCohorts: VintageCohort[]
  parMetrics: PARMetrics
  riskMetrics: RiskMetrics
  financialPerformance: FinancialPerformance
}

class LoanAnalysisService {
  private parseNumber(value: string | number): number {
    if (typeof value === 'number') return value
    return parseFloat(String(value).replace(/,/g, '')) || 0
  }

  private parseDate(dateStr: string): Date {
    try {
      return parseISO(dateStr)
    } catch {
      return new Date(dateStr)
    }
  }

  private getMaxDPD(loan: RawLoanData): number {
    return Math.max(
      this.parseNumber(loan['DPD <7 Days']),
      this.parseNumber(loan['DPD <30 Days']),
      this.parseNumber(loan['DPD <60 Days']),
      this.parseNumber(loan['DPD <90 Days'])
    )
  }

  // 1. Portfolio Metrics
  private computePortfolioMetrics(loans: RawLoanData[]): PortfolioMetrics {
    const totalDisbursed = loans.reduce((sum, l) => sum + this.parseNumber(l['Loan Amount']), 0)
    const outstandingBalance = loans.reduce((sum, l) => sum + this.parseNumber(l['Current Balance']), 0)
    const principalRepaid = totalDisbursed - outstandingBalance

    const uniqueBorrowers = new Set(loans.map(l => l['ID Number'])).size

    const repaidLoans = loans.filter(l => l['Loan Status'].toLowerCase() === 'repaid')
    const repaymentRate = loans.length > 0 ? repaidLoans.length / loans.length : 0

    const problemStatuses = ['late', 'overdue', 'defaulted']
    const problemLoans = loans.filter(l => problemStatuses.includes(l['Loan Status'].toLowerCase()))
    const problemLoanBalance = problemLoans.reduce((sum, l) => sum + this.parseNumber(l['Current Balance']), 0)

    return {
      totalLoans: loans.length,
      totalDisbursed,
      totalInterest: loans.reduce((sum, l) => sum + this.parseNumber(l['Interest Amount']), 0),
      outstandingBalance,
      principalRepaid,
      averageLoanSize: loans.length > 0 ? totalDisbursed / loans.length : 0,
      uniqueBorrowers,
      repaymentRate,
      activeLoans: loans.filter(l => l['Loan Status'].toLowerCase() === 'disbursed').length,
      lateLoans: loans.filter(l => l['Loan Status'].toLowerCase() === 'late').length,
      overdueLoans: loans.filter(l => l['Loan Status'].toLowerCase() === 'overdue').length,
      defaultedLoans: loans.filter(l => l['Loan Status'].toLowerCase() === 'defaulted').length,
      problemLoanBalance,
    }
  }

  // 2. Status Distribution
  private computeStatusDistribution(loans: RawLoanData[]): StatusDistribution[] {
    const statusMap = new Map<string, { count: number; disbursed: number; outstanding: number }>()

    loans.forEach(loan => {
      const status = loan['Loan Status'].toLowerCase()
      const existing = statusMap.get(status) || { count: 0, disbursed: 0, outstanding: 0 }
      
      statusMap.set(status, {
        count: existing.count + 1,
        disbursed: existing.disbursed + this.parseNumber(loan['Loan Amount']),
        outstanding: existing.outstanding + this.parseNumber(loan['Current Balance']),
      })
    })

    return Array.from(statusMap.entries()).map(([status, data]) => ({
      status,
      count: data.count,
      percentage: (data.count / loans.length) * 100,
      disbursed: data.disbursed,
      outstanding: data.outstanding,
    }))
  }

  // 3. Loan Size Distribution
  private computeLoanSizeDistribution(loans: RawLoanData[]): LoanSizeDistribution[] {
    const buckets = [
      { range: '<500', min: 0, max: 500 },
      { range: '500-1,000', min: 500, max: 1000 },
      { range: '1,000-2,000', min: 1000, max: 2000 },
      { range: '2,000-3,000', min: 2000, max: 3000 },
      { range: '>3,000', min: 3000, max: Infinity },
    ]

    const totalDisbursed = loans.reduce((sum, l) => sum + this.parseNumber(l['Loan Amount']), 0)

    return buckets.map(bucket => {
      const loansInBucket = loans.filter(l => {
        const amount = this.parseNumber(l['Loan Amount'])
        return amount > bucket.min && amount <= bucket.max
      })

      const totalAmount = loansInBucket.reduce((sum, l) => sum + this.parseNumber(l['Loan Amount']), 0)

      return {
        range: bucket.range,
        count: loansInBucket.length,
        percentage: (loansInBucket.length / loans.length) * 100,
        totalAmount,
        amountPercentage: (totalAmount / totalDisbursed) * 100,
      }
    })
  }

  // 4. DPD Buckets
  private computeDPDBuckets(loans: RawLoanData[]): DPDBucket[] {
    const buckets = [
      { range: 'Current (0)', min: 0, max: 0 },
      { range: '1-7 days', min: 1, max: 7 },
      { range: '8-30 days', min: 8, max: 30 },
      { range: '31-60 days', min: 31, max: 60 },
      { range: '61-90 days', min: 61, max: 90 },
      { range: '90+ days', min: 91, max: Infinity },
    ]

    const totalOutstanding = loans.reduce((sum, l) => sum + this.parseNumber(l['Current Balance']), 0)

    return buckets.map(bucket => {
      const loansInBucket = loans.filter(l => {
        const dpd = this.getMaxDPD(l)
        return dpd >= bucket.min && dpd <= bucket.max
      })

      const outstanding = loansInBucket.reduce((sum, l) => sum + this.parseNumber(l['Current Balance']), 0)

      return {
        range: bucket.range,
        count: loansInBucket.length,
        percentage: (loansInBucket.length / loans.length) * 100,
        outstanding,
        balancePercentage: totalOutstanding > 0 ? (outstanding / totalOutstanding) * 100 : 0,
        averageBalance: loansInBucket.length > 0 ? outstanding / loansInBucket.length : 0,
      }
    })
  }

  // 5. Vintage Analysis
  private computeVintageCohorts(loans: RawLoanData[]): VintageCohort[] {
    const cohortMap = new Map<string, RawLoanData[]>()

    loans.forEach(loan => {
      const date = this.parseDate(loan['Application Date'])
      const monthKey = format(date, 'yyyy-MM')
      
      if (!cohortMap.has(monthKey)) {
        cohortMap.set(monthKey, [])
      }
      cohortMap.get(monthKey)!.push(loan)
    })

    return Array.from(cohortMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, cohortLoans]) => {
        const totalDisbursed = cohortLoans.reduce((sum, l) => sum + this.parseNumber(l['Loan Amount']), 0)
        const outstanding = cohortLoans.reduce((sum, l) => sum + this.parseNumber(l['Current Balance']), 0)
        const repaid = totalDisbursed - outstanding

        return {
          month,
          loanCount: cohortLoans.length,
          totalDisbursed,
          averageLoanSize: totalDisbursed / cohortLoans.length,
          outstanding,
          repaid,
          repaymentPercentage: totalDisbursed > 0 ? (repaid / totalDisbursed) * 100 : 0,
        }
      })
  }

  // 6. PAR Metrics
  private computePARMetrics(loans: RawLoanData[]): PARMetrics {
    const totalOutstanding = loans.reduce((sum, l) => sum + this.parseNumber(l['Current Balance']), 0)

    const calculatePAR = (minDPD: number) => {
      const loansAtRisk = loans.filter(l => this.getMaxDPD(l) >= minDPD)
      const balance = loansAtRisk.reduce((sum, l) => sum + this.parseNumber(l['Current Balance']), 0)
      
      return {
        balance,
        percentage: totalOutstanding > 0 ? (balance / totalOutstanding) * 100 : 0,
        count: loansAtRisk.length,
      }
    }

    return {
      par1: calculatePAR(1),
      par7: calculatePAR(7),
      par30: calculatePAR(30),
      par60: calculatePAR(60),
      par90: calculatePAR(90),
    }
  }

  // 7. Risk Metrics
  private computeRiskMetrics(loans: RawLoanData[], parMetrics: PARMetrics): RiskMetrics {
    const totalDisbursed = loans.reduce((sum, l) => sum + this.parseNumber(l['Loan Amount']), 0)
    const totalOutstanding = loans.reduce((sum, l) => sum + this.parseNumber(l['Current Balance']), 0)
    const principalRepaid = totalDisbursed - totalOutstanding

    const problemStatuses = ['late', 'overdue', 'defaulted']
    const problemLoans = loans.filter(l => problemStatuses.includes(l['Loan Status'].toLowerCase()))
    const problemBalance = problemLoans.reduce((sum, l) => sum + this.parseNumber(l['Current Balance']), 0)

    // Loss provisions
    const get1to30Balance = () => {
      const loans1to30 = loans.filter(l => {
        const dpd = this.getMaxDPD(l)
        return dpd >= 1 && dpd <= 30
      })
      return loans1to30.reduce((sum, l) => sum + this.parseNumber(l['Current Balance']), 0)
    }

    const get31to60Balance = () => {
      const loans31to60 = loans.filter(l => {
        const dpd = this.getMaxDPD(l)
        return dpd >= 31 && dpd <= 60
      })
      return loans31to60.reduce((sum, l) => sum + this.parseNumber(l['Current Balance']), 0)
    }

    const get61to90Balance = () => {
      const loans61to90 = loans.filter(l => {
        const dpd = this.getMaxDPD(l)
        return dpd >= 61 && dpd <= 90
      })
      return loans61to90.reduce((sum, l) => sum + this.parseNumber(l['Current Balance']), 0)
    }

    const get90PlusBalance = () => {
      const loans90Plus = loans.filter(l => this.getMaxDPD(l) > 90)
      return loans90Plus.reduce((sum, l) => sum + this.parseNumber(l['Current Balance']), 0)
    }

    const balance1to30 = get1to30Balance()
    const balance31to60 = get31to60Balance()
    const balance61to90 = get61to90Balance()
    const balance90Plus = get90PlusBalance()

    const provision1to30 = balance1to30 * 0.05
    const provision31to60 = balance31to60 * 0.25
    const provision61to90 = balance61to90 * 0.50
    const provision90Plus = balance90Plus * 1.00

    // Average DPD
    const loansWithDPD = loans.filter(l => this.getMaxDPD(l) > 0)
    const avgDPD = loansWithDPD.length > 0
      ? loansWithDPD.reduce((sum, l) => sum + this.getMaxDPD(l), 0) / loansWithDPD.length
      : 0

    return {
      portfolioOutstandingRatio: totalDisbursed > 0 ? totalOutstanding / totalDisbursed : 0,
      collectionEfficiency: totalDisbursed > 0 ? principalRepaid / totalDisbursed : 0,
      par30Ratio: parMetrics.par30.percentage / 100,
      delinquencyRate: totalOutstanding > 0 ? problemBalance / totalOutstanding : 0,
      defaultRate: loans.length > 0 ? problemLoans.length / loans.length : 0,
      avgDaysPastDue: avgDPD,
      lossProvisions: {
        '1-30': { balance: balance1to30, rate: 0.05, provision: provision1to30 },
        '31-60': { balance: balance31to60, rate: 0.25, provision: provision31to60 },
        '61-90': { balance: balance61to90, rate: 0.50, provision: provision61to90 },
        '90+': { balance: balance90Plus, rate: 1.00, provision: provision90Plus },
        total: provision1to30 + provision31to60 + provision61to90 + provision90Plus,
      },
    }
  }

  // 8. Financial Performance
  private computeFinancialPerformance(loans: RawLoanData[]): FinancialPerformance {
    const interestIncome = loans.reduce((sum, l) => sum + this.parseNumber(l['Interest Amount']), 0)
    const lateFeeIncome = loans.reduce((sum, l) => sum + this.parseNumber(l['Late Fee Amount']), 0)
    const cashbackPaid = loans.reduce((sum, l) => sum + this.parseNumber(l['Cashback Amount']), 0)
    const netRevenue = interestIncome + lateFeeIncome - cashbackPaid

    const totalDisbursed = loans.reduce((sum, l) => sum + this.parseNumber(l['Loan Amount']), 0)
    const totalOutstanding = loans.reduce((sum, l) => sum + this.parseNumber(l['Current Balance']), 0)
    const principalRepaid = totalDisbursed - totalOutstanding

    return {
      interestIncome,
      lateFeeIncome,
      cashbackPaid,
      netRevenue,
      avgRevenuePerLoan: loans.length > 0 ? netRevenue / loans.length : 0,
      revenueYield: totalDisbursed > 0 ? (netRevenue / totalDisbursed) * 100 : 0,
      portfolioTurnover: totalDisbursed > 0 ? principalRepaid / totalDisbursed : 0,
      activePortfolio: totalOutstanding,
    }
  }

  // Main analysis function
  public async analyzeCSV(csvText: string): Promise<LoanAnalysisComplete> {
    return new Promise((resolve, reject) => {
      Papa.parse<RawLoanData>(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const loans = results.data

            const metrics = this.computePortfolioMetrics(loans)
            const statusDistribution = this.computeStatusDistribution(loans)
            const loanSizeDistribution = this.computeLoanSizeDistribution(loans)
            const dpdBuckets = this.computeDPDBuckets(loans)
            const vintageCohorts = this.computeVintageCohorts(loans)
            const parMetrics = this.computePARMetrics(loans)
            const riskMetrics = this.computeRiskMetrics(loans, parMetrics)
            const financialPerformance = this.computeFinancialPerformance(loans)

            resolve({
              metrics,
              statusDistribution,
              loanSizeDistribution,
              dpdBuckets,
              vintageCohorts,
              parMetrics,
              riskMetrics,
              financialPerformance,
            })
          } catch (error) {
            reject(error)
          }
        },
        error: (error: unknown) => {
          reject(error)
        },
      })
    })
  }
}

export const loanAnalysisService = new LoanAnalysisService()
