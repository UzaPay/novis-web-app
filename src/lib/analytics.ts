import {
  LoanBookRecord,
  PortfolioMetrics,
  StatusDistribution,
  DPDBucket,
  VintageCohort,
} from "@/types";
import { format, isValid, parse, parseISO } from "date-fns";

/**
 * Computes complete 8-section loan portfolio analysis from raw loan book data
 * Matches the Excel analysis format exactly
 */

// Helper to parse currency values
const parseCurrency = (value: number | string): number => {
  if (typeof value === "number") return value;
  return parseFloat(String(value).replace(/[,]/g, "")) || 0;
};

// Helper to calculate max DPD
const getMaxDPD = (loan: LoanBookRecord): number => {
  return Math.max(
    loan["DPD <7 Days"] || 0,
    loan["DPD <30 Days"] || 0,
    loan["DPD <60 Days"] || 0,
    loan["DPD <90 Days"] || 0,
  );
};

const parseLoanApplicationDate = (value: string): Date | null => {
  if (!value) return null;

  const isoDate = parseISO(value);
  if (isValid(isoDate)) return isoDate;

  const jsDate = new Date(value);
  if (isValid(jsDate)) return jsDate;

  const knownFormats = [
    "yyyy-MM-dd",
    "yyyy/MM/dd",
    "dd/MM/yyyy",
    "MM/dd/yyyy",
    "dd-MM-yyyy",
    "MM-dd-yyyy",
  ];

  for (const dateFormat of knownFormats) {
    const parsed = parse(value, dateFormat, new Date());
    if (isValid(parsed)) return parsed;
  }

  return null;
};

// 1. PORTFOLIO OVERVIEW (Executive Summary)
export function computePortfolioMetrics(
  loans: LoanBookRecord[],
): PortfolioMetrics {
  const totalLoans = loans.length;
  const totalDisbursed = loans.reduce(
    (sum, l) => sum + parseCurrency(l["Loan Amount"]),
    0,
  );
  const totalInterest = loans.reduce(
    (sum, l) => sum + parseCurrency(l["Interest Amount"]),
    0,
  );
  const outstandingBalance = loans.reduce(
    (sum, l) => sum + parseCurrency(l["Current Balance"]),
    0,
  );
  const principalRepaid = totalDisbursed - outstandingBalance;

  const repaidLoans = loans.filter(
    (l) => l["Loan Status"].toLowerCase() === "repaid",
  );
  const repaymentRate = totalLoans > 0 ? repaidLoans.length / totalLoans : 0;

  const activeLoans = loans.filter(
    (l) => l["Loan Status"].toLowerCase() === "disbursed",
  ).length;
  const lateLoans = loans.filter(
    (l) => l["Loan Status"].toLowerCase() === "late",
  ).length;
  const overdueLoans = loans.filter(
    (l) => l["Loan Status"].toLowerCase() === "overdue",
  ).length;
  const defaultedLoans = loans.filter(
    (l) => l["Loan Status"].toLowerCase() === "defaulted",
  ).length;

  const problemStatuses = ["late", "overdue", "defaulted"];
  const problemLoanBalance = loans
    .filter((l) => problemStatuses.includes(l["Loan Status"].toLowerCase()))
    .reduce((sum, l) => sum + parseCurrency(l["Current Balance"]), 0);

  const uniqueBorrowers = new Set(loans.map((l) => l["ID Number"])).size;

  return {
    totalLoans,
    totalDisbursed,
    totalInterest,
    outstandingBalance,
    principalRepaid,
    averageLoanSize: totalLoans > 0 ? totalDisbursed / totalLoans : 0,
    uniqueBorrowers,
    repaymentRate,
    activeLoans,
    lateLoans,
    overdueLoans,
    defaultedLoans,
    problemLoanBalance,
  };
}

// 2. STATUS DISTRIBUTION
export function computeStatusDistribution(
  loans: LoanBookRecord[],
): StatusDistribution[] {
  const statusMap = new Map<string, StatusDistribution>();

  loans.forEach((loan) => {
    const status = loan["Loan Status"].toLowerCase();
    if (!statusMap.has(status)) {
      statusMap.set(status, {
        status,
        count: 0,
        disbursed: 0,
        outstanding: 0,
      });
    }

    const dist = statusMap.get(status)!;
    dist.count++;
    dist.disbursed += parseCurrency(loan["Loan Amount"]);
    dist.outstanding += parseCurrency(loan["Current Balance"]);
  });

  return Array.from(statusMap.values()).sort(
    (a, b) => b.disbursed - a.disbursed,
  );
}

// 3. LOAN SIZE DISTRIBUTION
export function computeLoanSizeDistribution(loans: LoanBookRecord[]) {
  const buckets = [
    { range: "<500", min: 0, max: 500 },
    { range: "500-1,000", min: 500, max: 1000 },
    { range: "1,000-2,000", min: 1000, max: 2000 },
    { range: "2,000-3,000", min: 2000, max: 3000 },
    { range: ">3,000", min: 3000, max: 5000 },
    { range: ">5,000", min: 5000, max: 10000 },
    { range: ">10,000", min: 10000, max: 150000 },
    { range: ">15,000", min: 15000, max: 20000 },
  ];

  return buckets.map((bucket) => {
    const loansInBucket = loans.filter((l) => {
      const amount = parseCurrency(l["Loan Amount"]);
      return amount > bucket.min && amount <= bucket.max;
    });

    const count = loansInBucket.length;
    const totalAmount = loansInBucket.reduce(
      (sum, l) => sum + parseCurrency(l["Loan Amount"]),
      0,
    );

    return {
      range: bucket.range,
      count,
      percentage: loans.length > 0 ? count / loans.length : 0,
      totalAmount,
      amountPercentage:
        loans.reduce((sum, l) => sum + parseCurrency(l["Loan Amount"]), 0) > 0
          ? totalAmount /
            loans.reduce((sum, l) => sum + parseCurrency(l["Loan Amount"]), 0)
          : 0,
    };
  });
}

// 4. DPD BUCKETS (Delinquency Analysis)
export function computeDPDBuckets(loans: LoanBookRecord[]): DPDBucket[] {
  const buckets = [
    { range: "Current (0)", min: 0, max: 0 },
    { range: "1-7 days", min: 1, max: 7 },
    { range: "8-30 days", min: 8, max: 30 },
    { range: "31-60 days", min: 31, max: 60 },
    { range: "61-90 days", min: 61, max: 90 },
    { range: "90+ days", min: 91, max: Infinity },
  ];

  const totalOutstanding = loans.reduce(
    (sum, l) => sum + parseCurrency(l["Current Balance"]),
    0,
  );

  return buckets.map((bucket) => {
    const loansInBucket = loans.filter((l) => {
      const maxDPD = getMaxDPD(l);
      if (bucket.min === 0 && bucket.max === 0) {
        return maxDPD === 0;
      }
      return (
        maxDPD >= bucket.min &&
        (bucket.max === Infinity ? true : maxDPD <= bucket.max)
      );
    });

    const count = loansInBucket.length;
    const outstanding = loansInBucket.reduce(
      (sum, l) => sum + parseCurrency(l["Current Balance"]),
      0,
    );

    return {
      range: bucket.range,
      count,
      percentage: loans.length > 0 ? count / loans.length : 0,
      outstanding,
      balancePercentage:
        totalOutstanding > 0 ? outstanding / totalOutstanding : 0,
      averageBalance: count > 0 ? outstanding / count : 0,
    };
  });
}

// 5. PAR METRICS
export function computePARMetrics(loans: LoanBookRecord[]) {
  const totalOutstanding = loans.reduce(
    (sum, l) => sum + parseCurrency(l["Current Balance"]),
    0,
  );

  const thresholds = [1, 7, 30, 60, 90];
  const parMetrics: any = {};

  thresholds.forEach((threshold) => {
    const loansAtRisk = loans.filter((l) => getMaxDPD(l) >= threshold);
    const balanceAtRisk = loansAtRisk.reduce(
      (sum, l) => sum + parseCurrency(l["Current Balance"]),
      0,
    );

    parMetrics[`par${threshold}`] =
      totalOutstanding > 0 ? balanceAtRisk / totalOutstanding : 0;
  });

  return {
    ...parMetrics,
    collectionRate:
      loans.length > 0
        ? loans.reduce(
            (sum, l) =>
              sum +
              (parseCurrency(l["Loan Amount"]) -
                parseCurrency(l["Current Balance"])),
            0,
          ) / loans.reduce((sum, l) => sum + parseCurrency(l["Loan Amount"]), 0)
        : 0,
    delinquencyRate:
      totalOutstanding > 0
        ? loans
            .filter((l) =>
              ["late", "overdue", "defaulted"].includes(
                l["Loan Status"].toLowerCase(),
              ),
            )
            .reduce((sum, l) => sum + parseCurrency(l["Current Balance"]), 0) /
          totalOutstanding
        : 0,
  };
}

// 6. VINTAGE ANALYSIS (Monthly Cohorts)
export function computeVintageCohorts(
  loans: LoanBookRecord[],
): VintageCohort[] {
  const cohortMap = new Map<string, VintageCohort>();

  loans.forEach((loan) => {
    const appDate = parseLoanApplicationDate(String(loan["Application Date"]));
    if (!appDate) {
      return;
    }

    const month = format(appDate, "yyyy-MM");

    if (!cohortMap.has(month)) {
      cohortMap.set(month, {
        month,
        loanCount: 0,
        totalDisbursed: 0,
        averageLoanSize: 0,
        outstanding: 0,
        repaid: 0,
        repaymentPercentage: 0,
      });
    }

    const cohort = cohortMap.get(month)!;
    cohort.loanCount++;
    const loanAmount = parseCurrency(loan["Loan Amount"]);
    const currentBalance = parseCurrency(loan["Current Balance"]);

    cohort.totalDisbursed += loanAmount;
    cohort.outstanding += currentBalance;
    cohort.repaid += loanAmount - currentBalance;
  });

  // Calculate averages and percentages
  cohortMap.forEach((cohort) => {
    cohort.averageLoanSize =
      cohort.loanCount > 0 ? cohort.totalDisbursed / cohort.loanCount : 0;
    cohort.repaymentPercentage =
      cohort.totalDisbursed > 0 ? cohort.repaid / cohort.totalDisbursed : 0;
  });

  return Array.from(cohortMap.values()).sort((a, b) =>
    a.month.localeCompare(b.month),
  );
}

// 7. RISK METRICS
export function computeRiskMetrics(loans: LoanBookRecord[]) {
  const metrics = computePortfolioMetrics(loans);
  const parMetrics = computePARMetrics(loans);

  const loansWithDPD = loans.filter((l) => getMaxDPD(l) > 0);
  const avgDPD =
    loansWithDPD.length > 0
      ? loansWithDPD.reduce((sum, l) => sum + getMaxDPD(l), 0) /
        loansWithDPD.length
      : 0;

  // Loss provisions based on DPD
  const provisions = {
    provision_1_30: 0,
    provision_31_60: 0,
    provision_61_90: 0,
    provision_90_plus: 0,
  };

  loans.forEach((loan) => {
    const maxDPD = getMaxDPD(loan);
    const balance = parseCurrency(loan["Current Balance"]);

    if (maxDPD > 0 && maxDPD <= 30) {
      provisions.provision_1_30 += balance * 0.05; // 5% provision
    } else if (maxDPD > 30 && maxDPD <= 60) {
      provisions.provision_31_60 += balance * 0.25; // 25% provision
    } else if (maxDPD > 60 && maxDPD <= 90) {
      provisions.provision_61_90 += balance * 0.5; // 50% provision
    } else if (maxDPD > 90) {
      provisions.provision_90_plus += balance * 1.0; // 100% provision
    }
  });

  const totalProvisions = Object.values(provisions).reduce(
    (sum, p) => sum + p,
    0,
  );

  return {
    portfolioOutstandingRatio:
      metrics.totalDisbursed > 0
        ? metrics.outstandingBalance / metrics.totalDisbursed
        : 0,
    collectionEfficiency: metrics.repaymentRate,
    par30Ratio: parMetrics.par30,
    delinquencyRate: parMetrics.delinquencyRate,
    defaultRate:
      metrics.totalLoans > 0
        ? (metrics.lateLoans + metrics.overdueLoans + metrics.defaultedLoans) /
          metrics.totalLoans
        : 0,
    avgDaysPastDue: avgDPD,
    provisions,
    totalProvisions,
  };
}

// 8. FINANCIAL PERFORMANCE
export function computeFinancialPerformance(loans: LoanBookRecord[]) {
  const interestIncome = loans.reduce(
    (sum, l) => sum + parseCurrency(l["Interest Amount"]),
    0,
  );
  const lateFeeIncome = loans.reduce(
    (sum, l) => sum + parseCurrency(l["Late Fee Amount"]),
    0,
  );
  const cashbackPaid = loans.reduce(
    (sum, l) => sum + parseCurrency(l["Cashback Amount"]),
    0,
  );
  const netRevenue = interestIncome + lateFeeIncome - cashbackPaid;

  const totalDisbursed = loans.reduce(
    (sum, l) => sum + parseCurrency(l["Loan Amount"]),
    0,
  );
  const totalOutstanding = loans.reduce(
    (sum, l) => sum + parseCurrency(l["Current Balance"]),
    0,
  );
  const totalRepaid = totalDisbursed - totalOutstanding;

  // Repayment by status
  const statusGroups = new Map<
    string,
    { count: number; disbursed: number; repaid: number }
  >();

  loans.forEach((loan) => {
    const status = loan["Loan Status"].toLowerCase();
    if (!statusGroups.has(status)) {
      statusGroups.set(status, { count: 0, disbursed: 0, repaid: 0 });
    }

    const group = statusGroups.get(status)!;
    group.count++;
    const loanAmount = parseCurrency(loan["Loan Amount"]);
    const currentBalance = parseCurrency(loan["Current Balance"]);
    group.disbursed += loanAmount;
    group.repaid += loanAmount - currentBalance;
  });

  return {
    interestIncome,
    lateFeeIncome,
    cashbackPaid,
    netRevenue,
    avgRevenuePerLoan: loans.length > 0 ? netRevenue / loans.length : 0,
    revenueYield: totalDisbursed > 0 ? netRevenue / totalDisbursed : 0,
    totalDisbursed,
    totalOutstanding,
    totalRepaid,
    portfolioTurnover: totalDisbursed > 0 ? totalRepaid / totalDisbursed : 0,
    activePortfolio: totalOutstanding,
    repaymentByStatus: Array.from(statusGroups.entries()).map(
      ([status, data]) => ({
        status,
        count: data.count,
        disbursed: data.disbursed,
        repaid: data.repaid,
        repaymentPercentage:
          data.disbursed > 0 ? data.repaid / data.disbursed : 0,
      }),
    ),
  };
}

// COMPLETE ANALYSIS - Combines all 8 sections
export function computeCompleteAnalysis(loans: LoanBookRecord[]) {
  return {
    // 1. Executive Summary
    portfolioMetrics: computePortfolioMetrics(loans),

    // 2. Portfolio Analysis
    statusDistribution: computeStatusDistribution(loans),
    loanSizeDistribution: computeLoanSizeDistribution(loans),

    // 3. Delinquency Analysis
    dpdBuckets: computeDPDBuckets(loans),

    // 4. PAR Analysis
    parMetrics: computePARMetrics(loans),

    // 5. Vintage Analysis
    vintageCohorts: computeVintageCohorts(loans),

    // 6. Risk Metrics
    riskMetrics: computeRiskMetrics(loans),

    // 7. Financial Performance
    financialPerformance: computeFinancialPerformance(loans),

    // Metadata
    asOfDate: new Date().toISOString(),
    totalRecords: loans.length,
  };
}
