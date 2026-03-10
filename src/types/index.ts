export type ObjectId = string;
export type EntityRef<T> = ObjectId | T;

export type IdentityDocumentType =
  | "national_id"
  | "passport"
  | "alien_id"
  | "military_id"
  | "drivers_license";

export type UserRole =
  | "SuperAdmin"
  | "Investor"
  | "OrganizationAdmin"
  | "OrganizationManager"
  | "OrganizationUser"
  | "APIUser"
  | "BusinessAdmin"
  | "BusinessManager"
  | "BusinessOwner"
  | "Guarantor"
  | "Employee"
  | "User";

export type UserStatus =
  | "active"
  | "inactive"
  | "suspended"
  | "archived"
  | "banned";

export type LoanLimitStatus = "unset" | "set" | "processing" | "frozen";
export type LoanStatus = "active" | "inactive" | "banned" | "suspended";
export type AppLanguage = "eng" | "kisw";

export type LoanApplicationStatus =
  | "review"
  | "processing"
  | "approved"
  | "rejected"
  | "disbursed"
  | "repaid"
  | "late"
  | "defaulted"
  | "overdue"
  | "archived"
  | "cancelled";

export type LoanSecurityType = "payslip" | "log_book" | "title_deed" | "none";

export type LoanRepaymentType = "full" | "partial";
export type LoanRepaymentStatus =
  | "pending"
  | "full"
  | "partial"
  | "failed"
  | "reversed";

export type CreditReportType = "personal" | "business";
export type CreditReportProcessingStatus = "completed" | "pending" | "failed";

export type CashbackUsedReason =
  | "LOAN_REPAYMENT"
  | "CREDIT_REPORT_PURCHASE"
  | "FEE_WAIVER"
  | "OTHER";

export type CashbackEarnedReason =
  | "EARLY_LOAN_REPAYMENT"
  | "ON_TIME_LOAN_REPAYMENT"
  | "PROMOTION"
  | "MANUAL_ADJUSTMENT";

export type CashbackEntryStatus = "ACTIVE" | "EXPIRED";

export type TransactionStatus = "completed" | "reversed" | "partially_reversed";

export type ActivityType =
  | "CREDIT_LIMIT_SET"
  | "CREDIT_LIMIT_EVALUATED"
  | "CREDIT_LIMIT_INCREASED"
  | "CREDIT_LIMIT_DECREASED"
  | "CREDIT_LIMIT_FROZEN"
  | "CREDIT_LIMIT_UNFROZEN"
  | "CREDIT_LIMIT_REJECTED"
  | "CREDIT_LIMIT_REVIEWED"
  | "CREDIT_LIMIT_OVERRIDE"
  | "CREDIT_LIMIT_SUSPENDED"
  | "CREDIT_LIMIT_SMS_SENT"
  | "CREDIT_POLICY_VERSION_APPLIED"
  | "LOAN_REQUEST_CREATED"
  | "LOAN_REQUEST_UPDATED"
  | "LOAN_REQUEST_STATUS_CHANGED"
  | "LOAN_CREATED"
  | "LOAN_PREAPPROVED"
  | "LOAN_APPROVED"
  | "LOAN_DISBURSED"
  | "LOAN_REPAID_FULL"
  | "LOAN_REPAID_PARTIAL"
  | "LOAN_DUE_SOON"
  | "LOAN_PAYMENT_LATE"
  | "LOAN_OVERDUE"
  | "LOAN_DEFAULTED"
  | "LOAN_LATE_FEE_APPLIED"
  | "FEE_CHARGED"
  | "CASHBACK_EARNED"
  | "CASHBACK_REDEEMED"
  | "REFERRAL_REWARD_EARNED"
  | "REFERRAL_REWARD_REDEEMED"
  | "PROMOTION_REDEEMED"
  | "NET_CONTRIBUTION_CALCULATED"
  | "NET_CONTRIBUTION_THRESHOLD_MET"
  | "NET_CONTRIBUTION_THRESHOLD_FAILED"
  | "LOAN_VOLATILITY_DETECTED"
  | "EARLY_WARNING_DAYS_LATE"
  | "EARLY_WARNING_LOW_CONTRIBUTION"
  | "RISK_FLAG_ADDED"
  | "RISK_FLAG_REMOVED"
  | "SYSTEM_GUARDRAIL_TRIGGERED"
  | "CRB_REPORT_REQUESTED"
  | "CRB_REPORT_REFRESHED"
  | "CRB_REPORT_EXPIRED"
  | "USER_REGISTERED"
  | "USER_UPDATED"
  | "USER_STATUS_UPDATED"
  | "USER_REMOVED"
  | "ADMIN_NOTE_ADDED"
  | "MANUAL_OVERRIDE_APPLIED"
  | "AUTOMATED_DECISION_APPLIED"
  | "COLLECTION_CONTACTED"
  | "GUARANTOR_ALERTED"
  | (string & {});

export interface PersonContact {
  postal_address?: string | null;
  city?: string | null;
  county_of_residence?: string | null;
  email?: string | null;
  mobile: string;
  other_mobile_numbers?: string[];
}

export interface PersonNotificationPreferences {
  marketing_emails?: boolean;
  push_notifications?: boolean;
  sms_notifications?: boolean;
  whatsapp_notifications?: boolean;
}

export interface PersonDeviceToken {
  token: string;
  platform: "ios" | "android" | "web";
}

export interface Person {
  _id: ObjectId;
  id?: string | null;
  id_no: string;
  id_verification_status?: boolean;
  identity_document_type?: IdentityDocumentType;
  id_verification?: Record<string, unknown>;
  id_document_url?: string | null;
  surname: string;
  other_names: string;
  full_name?: string;
  sex?: "male" | "female" | "other" | null;
  avatar_url?: string;
  contact: PersonContact;
  tax_pin?: string | null;
  tax_pin_verification?: Record<string, unknown>;
  tax_pin_verified?: boolean;
  marital_status?: string | null;
  no_of_dependants?: number;
  role: UserRole;
  organization_id?: ObjectId | null;
  notification_preferences?: PersonNotificationPreferences;
  devices?: PersonDeviceToken[];
  created_at?: string;
  modified_at?: string;
}

export interface UserPreferences {
  share_data?: boolean;
  loan_offers?: boolean;
  promo_offers?: boolean;
  email_receipts?: boolean;
  [key: string]: unknown;
}

export interface UserBankInfo {
  bank_name?: string;
  acc_no?: string;
}

export interface UserAppDevice {
  model?: string;
  platform?: string;
  uuid?: string;
  version?: string;
  manufacturer?: string;
}

export interface User extends Person {
  username?: string;
  email?: string;
  guarantor?: EntityRef<User> | null;
  avatar?: string | null;
  bank_info?: UserBankInfo;
  monthly_income?: number;
  income_source?: string;
  has_loan_limit?: boolean;
  loan_limit_status?: LoanLimitStatus;
  max_loan_limit?: number;
  available_loan_limit?: number;
  last_limit_update?: string | null;
  pin?: string | null;
  is_pin_set?: boolean;
  documents?: ObjectId[];
  status: UserStatus;
  loan_status?: LoanStatus;
  free_reports_count?: number;
  sessions?: unknown[];
  terms_accepted?: boolean;
  terms_accepted_on?: string | null;
  preferences?: UserPreferences;
  points?: number;
  promocode?: string;
  device?: UserAppDevice;
  applications?: ObjectId[];
  credit_reports?: ObjectId[];
  password?: string;
  lang?: AppLanguage;
  confirmation_code?: number | null;
  app_version?: string | null;
  created_at: string;
  modified_at: string;
  last_payment_success_at?: string | null;
  reactivation_sms_sent_at?: string | null;
  loan_limit_notified_at?: string | null;
  loan_limit_notified_amount?: number | null;
  credit_limit_frozen_at?: string | null;
  credit_limit_freeze_reason?: string | null;
  credit_profile_version?: number;
  risk_flags?: string[];
}

export interface CustomerOutstandingLoans {
  _id?: ObjectId | null;
  all_loans_count: number;
  disbursed_loans_count: number;
  total_borrowing: number;
}

export interface Customer extends User {
  total_outstanding_loans?: CustomerOutstandingLoans;
}

export interface AuthResponse {
  user: User;
  role: UserRole;
  access_token: string;
  refresh_token?: string;
}

export interface LoanCategory {
  _id: ObjectId;
  id?: string | null;
  name: string;
  active: boolean;
  slug?: string;
  description: string;
  icon?: string | null;
  image_url?: string | null;
  display_order?: number | null;
  created_at: string;
  modified_at: string;
}

export interface LoanTypeFee {
  fee_name: string;
  fee_type: "flat" | "percentage";
  fee_amount: number;
}

export interface LoanType {
  _id: ObjectId;
  loan_name: string;
  description?: string;
  category: EntityRef<LoanCategory>;
  min_loan_amount: number;
  max_loan_amount: number;
  min_membership_period: number;
  min_guarantors: number;
  max_repayment_period: number;
  interest_rate_percent: number;
  interest_frequency_days: number;
  interest_per_month: number;
  fees: LoanTypeFee[];
  security_required: boolean;
  acceptable_security_types: LoanSecurityType[];
  required_documents: string[];
  created_at?: string;
  modified_at?: string;
}

export interface LoanApplication {
  _id: ObjectId;
  id?: string | null;
  loan_type: LoanType;
  loan_amount: number;
  security_type?: LoanSecurityType;
  interest_rate: number;
  loan_interest: number;
  balance?: number;
  total_repaid?: number;
  customer: User;
  guarantors?: Array<EntityRef<User>>;
  documents?: ObjectId[];
  status: LoanApplicationStatus;
  is_auto_disbursed?: boolean;
  is_auto_preapproved?: boolean;
  payment_details?: ObjectId | null;
  repayments?: Array<EntityRef<LoanRepayment>>;
  crb_feature_snapshot?: ObjectId | null;
  activity?: Array<EntityRef<ActivityLog>>;
  tenure_days: number;
  fees?: LoanTypeFee[];
  late_fee_applied?: boolean;
  loan_purpose?: string;
  repayment_quality?: "on_time" | "late" | "defaulted" | null;
  due_date?: string | null;
  preapproved_by?: ObjectId | null;
  approved_by?: ObjectId | null;
  disbursed_by?: ObjectId | null;
  cashback_amount?: number;
  notes?: string;
  fully_repaid_at?: string | null;
  last_payment_success_at?: string | null;
  created_at: string;
  modified_at: string;
  days_in_arrears?: number;
}

export type Loan = LoanApplication;

export interface LoanRepayment {
  _id: ObjectId;
  id?: string | null;
  loan_application_id: EntityRef<LoanApplication>;
  amount: number;
  repayment_type?: LoanRepaymentType;
  status?: LoanRepaymentStatus;
  payment_reference: string;
  payment_details: ObjectId;
  created_at: string;
  modified_at: string;
}

export interface ActivityLog {
  _id: ObjectId;
  id?: string | null;
  user?: EntityRef<User> | null;
  metadata?: Record<string, unknown>;
  activity_type?: ActivityType;
  description?: string;
  activity_name: string;
  message?: string;
  created_at: string;
}

export interface CreditReportLink {
  title?: string;
  doc_type?: string;
  doc_url?: string;
}

export interface CreditReport {
  _id: ObjectId;
  id?: string | null;
  user: EntityRef<User>;
  report_type: CreditReportType;
  crb_token?: string | null;
  transaction_reference?: ObjectId | null;
  processing_status: CreditReportProcessingStatus;
  processed_report?: Record<string, unknown> | null;
  has_accounts: boolean;
  request_reason?: string;
  links: CreditReportLink[];
  seen: boolean;
  created_at: string;
  modified_at: string;
}

export interface Transaction {
  _id: string;
  id: string;
  amount: number;
  counterparty: Partial<User>;
  tax: number;
  transaction_fee: number;
  discount: number;
  payment_channel: "mobile_money" | string;
  payment_type: "credit" | "debit" | string;
  payment_account_no: string;
  payment_account_no_redacted: string;
  paid_via: string;
  payment_reference: string;
  payment_status: "completed" | "pending" | "failed" | string;
  receipt_url: string | null;
  created_at: Date;
  modified_at: Date;
  organization_id: string | null;
  cashier: string;
}

export interface CashbackWallet {
  _id: ObjectId;
  user_id: EntityRef<User>;
  available_balance: number;
  lifetime_earned: number;
  lifetime_used: number;
  created_at: string;
  modified_at: string;
}

export interface CashbackRedemption {
  _id: ObjectId;
  user_id: EntityRef<User>;
  amount: number;
  description: string;
  used_reason: CashbackUsedReason;
  reference_id?: ObjectId | null;
  redeemed_at: string;
  created_at: string;
  modified_at: string;
}

export interface CashbackLedger {
  _id: ObjectId;
  user_id: EntityRef<User>;
  loan_id?: EntityRef<LoanApplication>;
  cashback_amount: number;
  description: string;
  earned_reason: CashbackEarnedReason;
  ladder_tier: string;
  status: CashbackEntryStatus;
  awarded_at: string;
  expires_at: string;
  created_at: string;
  modified_at: string;
}

export interface SystemInformation {
  _id: ObjectId;
  mpesa_b2c_utility_balance: number;
  mpesa_b2c_working_balance: number;
  mpesa_c2b_utility_balance: number;
  mpesa_c2b_working_balance: number;
  created_at: string;
  modified_at: string;
}

// Loan Book Record - matches the loan-book endpoint payload.
export interface LoanBookRecord {
  "Application Date": string;
  "Loan Type": string;
  Tenor: string;
  "Customer Name": string;
  "Mobile Number": string;
  "ID Number": string;
  "Loan Amount": number;
  "Interest Amount": number;
  "Current Balance": number;
  "Late Fee Applied?": string;
  "Late Fee Amount": number;
  "Cashback Amount": number;
  "Loan Status": string;
  "Due Date": string;
  "DPD <7 Days": number;
  "DPD <30 Days": number;
  "DPD <60 Days": number;
  "DPD <90 Days": number;
}

export interface PortfolioMetrics {
  totalLoans: number;
  totalDisbursed: number;
  totalInterest: number;
  outstandingBalance: number;
  principalRepaid: number;
  averageLoanSize: number;
  uniqueBorrowers: number;
  repaymentRate: number;
  activeLoans: number;
  lateLoans: number;
  overdueLoans: number;
  defaultedLoans: number;
  problemLoanBalance: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  disbursed: number;
  outstanding: number;
}

export interface LoanSizeDistribution {
  range: string;
  count: number;
  percentage: number;
  totalAmount: number;
  amountPercentage: number;
}

export interface DPDBucket {
  range: string;
  count: number;
  percentage: number;
  outstanding: number;
  balancePercentage: number;
  averageBalance: number;
}

export interface VintageCohort {
  month: string;
  loanCount: number;
  totalDisbursed: number;
  averageLoanSize: number;
  outstanding: number;
  repaid: number;
  repaymentPercentage: number;
}

export interface PARMetrics {
  par1: number;
  par7: number;
  par30: number;
  par60: number;
  par90: number;
  collectionRate: number;
  delinquencyRate: number;
}

export interface RiskMetrics {
  portfolioOutstandingRatio: number;
  collectionEfficiency: number;
  par30Ratio: number;
  delinquencyRate: number;
  defaultRate: number;
  avgDaysPastDue: number;
  provisions: {
    provision_1_30: number;
    provision_31_60: number;
    provision_61_90: number;
    provision_90_plus: number;
  };
  totalProvisions: number;
}

export interface FinancialPerformance {
  interestIncome: number;
  lateFeeIncome: number;
  cashbackPaid: number;
  netRevenue: number;
  avgRevenuePerLoan: number;
  revenueYield: number;
  totalDisbursed: number;
  totalOutstanding: number;
  totalRepaid: number;
  portfolioTurnover: number;
  activePortfolio: number;
  repaymentByStatus: Array<{
    status: string;
    count: number;
    disbursed: number;
    repaid: number;
    repaymentPercentage: number;
  }>;
}

export interface LoanAnalysis {
  portfolioMetrics: PortfolioMetrics;
  statusDistribution: StatusDistribution[];
  loanSizeDistribution: LoanSizeDistribution[];
  dpdBuckets: DPDBucket[];
  parMetrics: PARMetrics;
  vintageCohorts: VintageCohort[];
  riskMetrics: RiskMetrics;
  financialPerformance: FinancialPerformance;
  asOfDate: string;
  totalRecords: number;
}

export interface LoanApprovalPayload {
  loanId: string;
}

export interface LoanRejectionPayload {
  loanId: string;
}

export interface LoanDisbursementPayload {
  loanId: string;
}

export interface LoanRepaymentPayload {
  amount: number;
  payment_reference_id: string;
}
