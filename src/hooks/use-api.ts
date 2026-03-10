import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import {
  ActivityLog,
  CashbackLedger,
  CashbackWallet,
  CreditReport,
  Customer,
  Loan,
  LoanBookRecord,
  LoanCategory,
  LoanType,
  PortfolioMetrics,
  Transaction,
  LoanApprovalPayload,
  LoanRejectionPayload,
  LoanStatus,
} from "@/types";
import {
  computeCompleteAnalysis,
  computePortfolioMetrics,
} from "@/lib/analytics";
import { toast } from "sonner";

export type PaginatedResponse<T> = {
  success: boolean;
  docs: T[];
  data?: T[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
};

type ApiCollectionResponse<T> = {
  success?: boolean;
  data?: T[];
  docs?: T[];
};

type TransactionQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  status?: string;
  payment_channel?: string;
  customer?: string;
};

const makePaginated = <T>(
  docs: T[],
  page = 1,
  limit = docs.length || 20,
): PaginatedResponse<T> => {
  const totalDocs = docs.length;
  const totalPages = Math.max(1, Math.ceil(totalDocs / Math.max(limit, 1)));

  return {
    success: true,
    docs,
    data: docs,
    totalDocs,
    limit,
    totalPages,
    page,
    pagingCounter: (page - 1) * limit + 1,
    hasPrevPage: page > 1,
    hasNextPage: page < totalPages,
    prevPage: page > 1 ? page - 1 : null,
    nextPage: page < totalPages ? page + 1 : null,
  };
};

const extractCollection = <T>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== "object") return [];

  const maybeCollection = payload as ApiCollectionResponse<T> & {
    loan_book?: T[] | T[][];
    items?: T[] | T[][];
    results?: T[] | T[][];
    transactions?: T[] | T[][];
    records?: T[] | T[][];
  };

  const raw =
    maybeCollection.docs ??
    maybeCollection.data ??
    maybeCollection.loan_book ??
    maybeCollection.items ??
    maybeCollection.results ??
    maybeCollection.transactions ??
    maybeCollection.records ??
    [];

  if (Array.isArray(raw) && raw.length > 0 && Array.isArray(raw[0])) {
    return (raw as T[][]).flat();
  }

  return Array.isArray(raw) ? (raw as T[]) : [];
};

const extractOne = <T>(payload: unknown): T => {
  if (payload && typeof payload === "object") {
    const maybeWrapped = payload as { data?: T; doc?: T; user?: T; wallet?: T };
    return (maybeWrapped.data ??
      maybeWrapped.doc ??
      maybeWrapped.user ??
      maybeWrapped.wallet ??
      payload) as T;
  }

  return payload as T;
};

const toPaginatedResponse = <T>(
  payload: unknown,
  fallbackPage = 1,
  fallbackLimit = 20,
): PaginatedResponse<T> => {
  if (payload && typeof payload === "object") {
    const maybePaginated = payload as Partial<PaginatedResponse<T>>;
    if (Array.isArray(maybePaginated.docs)) {
      return {
        success: maybePaginated.success ?? true,
        docs: maybePaginated.docs,
        data: maybePaginated.data,
        totalDocs: maybePaginated.totalDocs ?? maybePaginated.docs.length,
        limit: maybePaginated.limit ?? fallbackLimit,
        totalPages:
          maybePaginated.totalPages ??
          Math.max(
            1,
            Math.ceil(
              (maybePaginated.totalDocs ?? maybePaginated.docs.length) /
                Math.max(maybePaginated.limit ?? fallbackLimit, 1),
            ),
          ),
        page: maybePaginated.page ?? fallbackPage,
        pagingCounter: maybePaginated.pagingCounter ?? 1,
        hasPrevPage: maybePaginated.hasPrevPage ?? false,
        hasNextPage: maybePaginated.hasNextPage ?? false,
        prevPage: maybePaginated.prevPage ?? null,
        nextPage: maybePaginated.nextPage ?? null,
      };
    }
  }

  return makePaginated(
    extractCollection<T>(payload),
    fallbackPage,
    fallbackLimit,
  );
};

const safeErrorMessage = (error: any, fallback: string) => {
  return error?.response?.data?.message || error?.message || fallback;
};

export const queryKeys = {
  loanBook: ["loan-book"] as const,
  loans: ["loans"] as const,
  loan: (id: string) => ["loan", id] as const,
  loanActivities: (loanId: string) => ["loan-activities", loanId] as const,
  loansByStatus: (status: string) => ["loans", status] as const,
  customers: ["customers"] as const,
  customer: (id: string) => ["customer", id] as const,
  customerLoans: (id: string) => ["customer-loans", id] as const,
  customerTransactions: (id: string) => ["customer-transactions", id] as const,
  customerCreditReports: (id: string) =>
    ["customer-credit-reports", id] as const,
  customerCashbackWallet: (id: string) =>
    ["customer-cashback-wallet", id] as const,
  customerCashbackLedger: (id: string) =>
    ["customer-cashback-ledger", id] as const,
  loanTypes: ["loan-types"] as const,
  loanCategories: ["loan-categories"] as const,
  transactions: ["transactions"] as const,
  metrics: ["metrics"] as const,
  analysis: ["analysis"] as const,
  activityLog: ["activity-log"] as const,
};

// ==============================================
// LOAN BOOK - Get raw data from API
// ==============================================
export function useLoanBook() {
  return useQuery({
    queryKey: queryKeys.loanBook,
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<LoanBookRecord>>(
        "/api/v1/lending/loan-book",
      );
      return extractCollection<LoanBookRecord>(response.data);
    },
    staleTime: 1000 * 60,
    refetchInterval: 120000,
  });
}

// ==============================================
// ANALYTICS - Computed from loan book data
// ==============================================
export function useCompleteAnalysis() {
  const { data: loanBook } = useLoanBook();

  return useQuery({
    queryKey: [...queryKeys.analysis, loanBook?.length],
    queryFn: () => {
      if (!loanBook || loanBook.length === 0) return null;
      return computeCompleteAnalysis(loanBook);
    },
    enabled: !!loanBook && loanBook.length > 0,
    staleTime: 1000 * 60,
  });
}

// ==============================================
// PORTFOLIO METRICS - Computed from loan book
// ==============================================
export function usePortfolioMetrics() {
  const { data: loanBook } = useLoanBook();

  return useQuery({
    queryKey: [...queryKeys.metrics, loanBook?.length],
    queryFn: () => {
      if (!loanBook || loanBook.length === 0) {
        return {
          totalLoans: 0,
          totalDisbursed: 0,
          totalInterest: 0,
          outstandingBalance: 0,
          principalRepaid: 0,
          averageLoanSize: 0,
          uniqueBorrowers: 0,
          repaymentRate: 0,
          activeLoans: 0,
          lateLoans: 0,
          overdueLoans: 0,
          defaultedLoans: 0,
          problemLoanBalance: 0,
        } as PortfolioMetrics;
      }
      return computePortfolioMetrics(loanBook);
    },
    enabled: !!loanBook,
    staleTime: 1000 * 60,
  });
}

// ==============================================
// LOANS - Using /api/v1/lending endpoints
// ==============================================

export function useLoans(params?: {
  status?: string;
  page?: number;
  limit?: number;
  customer?: string;
}) {
  return useQuery({
    queryKey: [...queryKeys.loans, params],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<Loan>>(
        "/api/v1/lending",
        {
          params,
        },
      );
      return toPaginatedResponse<Loan>(
        response.data,
        params?.page ?? 1,
        params?.limit ?? 20,
      );
    },
  });
}

export function useLoan(id: string) {
  return useQuery({
    queryKey: queryKeys.loan(id),
    queryFn: async () => {
      try {
        const response = await apiClient.get<Loan>(`/api/v1/lending/${id}`);
        return extractOne<Loan>(response.data);
      } catch (primaryError) {
        const response = await apiClient.get<
          PaginatedResponse<Loan> | ApiCollectionResponse<Loan> | Loan[]
        >("/api/v1/lending", { params: { search: id, limit: 100 } });

        const docs = extractCollection<Loan>(response.data);
        const matched = docs.find((item) => item._id === id || item.id === id);
        if (matched) return matched;

        throw primaryError;
      }
    },
    enabled: !!id,
  });
}

export function useLoanActivities(loanId: string, loan?: Loan) {
  return useQuery({
    queryKey: [
      ...queryKeys.loanActivities(loanId),
      loan?.activity?.length ?? 0,
    ],
    queryFn: async () => {
      try {
        const response = await apiClient.get<
          | PaginatedResponse<ActivityLog>
          | ApiCollectionResponse<ActivityLog>
          | ActivityLog[]
        >(`/api/v1/lending/${loanId}/activities`);
        return extractCollection<ActivityLog>(response.data);
      } catch {
        const embedded = (loan?.activity ?? []) as Array<ActivityLog | string>;
        return embedded.filter(
          (item) => typeof item === "object",
        ) as ActivityLog[];
      }
    },
    enabled: !!loanId,
  });
}

export function useLoanApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: LoanApprovalPayload) => {
      const response = await apiClient.patch(
        `/api/v1/lending/${payload.loanId}/approve`,
      );
      return response.data;
    },
    onSuccess: (_, payload) => {
      toast.success("Loan approved successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.loans });
      queryClient.invalidateQueries({
        queryKey: queryKeys.loan(payload.loanId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.loanActivities(payload.loanId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.loanBook });
      queryClient.invalidateQueries({ queryKey: queryKeys.metrics });
      queryClient.invalidateQueries({ queryKey: queryKeys.activityLog });
    },
    onError: (error: any) => {
      toast.error(safeErrorMessage(error, "Failed to approve loan"));
    },
  });
}

export function useLoanRejection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: LoanRejectionPayload) => {
      const response = await apiClient.patch(
        `/api/v1/lending/${payload.loanId}/reject`,
      );
      return response.data;
    },
    onSuccess: (_, payload) => {
      toast.success("Loan rejected");
      queryClient.invalidateQueries({ queryKey: queryKeys.loans });
      queryClient.invalidateQueries({
        queryKey: queryKeys.loan(payload.loanId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.loanActivities(payload.loanId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.loanBook });
      queryClient.invalidateQueries({ queryKey: queryKeys.metrics });
      queryClient.invalidateQueries({ queryKey: queryKeys.activityLog });
    },
    onError: (error: any) => {
      toast.error(safeErrorMessage(error, "Failed to reject loan"));
    },
  });
}

export function useLoanDisbursement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (loanId: string) => {
      const response = await apiClient.patch(
        `/api/v1/lending/${loanId}/disburse`,
      );
      return response.data;
    },
    onSuccess: (_, loanId) => {
      toast.success("Loan disbursed successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.loans });
      queryClient.invalidateQueries({ queryKey: queryKeys.loan(loanId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.loanActivities(loanId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.loanBook });
      queryClient.invalidateQueries({ queryKey: queryKeys.metrics });
      queryClient.invalidateQueries({ queryKey: queryKeys.activityLog });
    },
    onError: (error: any) => {
      toast.error(safeErrorMessage(error, "Failed to disburse loan"));
    },
  });
}

export function useLoanCancellation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ loanId }: { loanId: string }) => {
      try {
        const response = await apiClient.patch(
          `/api/v1/lending/${loanId}/cancel`,
        );
        return response.data;
      } catch {
        const fallbackResponse = await apiClient.patch(
          `/api/v1/lending/${loanId}/status`,
          {
            status: "cancelled",
          },
        );
        return fallbackResponse.data;
      }
    },
    onSuccess: (_, payload) => {
      toast.success("Loan application cancelled");
      queryClient.invalidateQueries({ queryKey: queryKeys.loans });
      queryClient.invalidateQueries({
        queryKey: queryKeys.loan(payload.loanId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.loanActivities(payload.loanId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.loanBook });
      queryClient.invalidateQueries({ queryKey: queryKeys.metrics });
      queryClient.invalidateQueries({ queryKey: queryKeys.activityLog });
    },
    onError: (error: any) => {
      toast.error(safeErrorMessage(error, "Failed to cancel loan application"));
    },
  });
}

// ==============================================
// CUSTOMERS
// ==============================================

export function useCustomers() {
  return useQuery({
    queryKey: queryKeys.customers,
    queryFn: async () => {
      const response =
        await apiClient.get<PaginatedResponse<Customer>>("/api/v1/users");
      return toPaginatedResponse<Customer>(response.data);
    },
  });
}

export function useCustomersPaginated(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  hasLoans?: boolean;
  hasCreditReports?: boolean;
  joinedRange?: string;
  sort?: string;
}) {
  return useQuery({
    queryKey: [...queryKeys.customers, params],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<Customer>>(
        "/api/v1/users",
        { params },
      );
      return toPaginatedResponse<Customer>(
        response.data,
        params?.page ?? 1,
        params?.limit ?? 20,
      );
    },
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: queryKeys.customer(id),
    queryFn: async () => {
      try {
        const response = await apiClient.get<Customer>(`/api/v1/users/${id}`);
        return extractOne<Customer>(response.data);
      } catch (primaryError) {
        const response = await apiClient.get<
          | PaginatedResponse<Customer>
          | ApiCollectionResponse<Customer>
          | Customer[]
        >("/api/v1/users", { params: { search: id, limit: 100 } });

        const docs = extractCollection<Customer>(response.data);
        const matched = docs.find(
          (item) => item._id === id || item.id === id || item.id_no === id,
        );
        if (matched) return matched;

        throw primaryError;
      }
    },
    enabled: !!id,
  });
}

export function useCustomerLoans(
  customerId: string,
  params?: { page?: number; limit?: number; status?: LoanStatus | string },
) {
  return useQuery({
    queryKey: [...queryKeys.customerLoans(customerId), params],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<Loan>>(
        "/api/v1/lending",
        {
          params: {
            customer: customerId,
            ...params,
          },
        },
      );
      return toPaginatedResponse<Loan>(
        response.data,
        params?.page ?? 1,
        params?.limit ?? 20,
      );
    },
    enabled: !!customerId,
  });
}

export function useCustomerCreditReports(customerId: string) {
  return useQuery({
    queryKey: queryKeys.customerCreditReports(customerId),
    queryFn: async () => {
      try {
        const response = await apiClient.get<
          PaginatedResponse<CreditReport> | ApiCollectionResponse<CreditReport>
        >(`/api/v1/crb/reports/list`);
        return extractCollection<CreditReport>(response.data.docs);
      } catch {
        const response = await apiClient.get<
          PaginatedResponse<CreditReport> | ApiCollectionResponse<CreditReport>
        >("/api/v1/credit-reports", { params: { user: customerId } });
        return extractCollection<CreditReport>(response.data);
      }
    },
    enabled: !!customerId,
  });
}

export function useCustomerTransactions(
  customerId: string,
  params?: Omit<TransactionQueryParams, "customer">,
) {
  return useQuery({
    queryKey: [...queryKeys.customerTransactions(customerId), params],
    queryFn: async () => {
      const response = await apiClient.get<
        | PaginatedResponse<Transaction>
        | ApiCollectionResponse<Transaction>
        | Transaction[]
      >(`/api/v1/transactions/customer/${customerId}`, {
        params: {
          customer: customerId,
          sort: params?.sort ?? "-created_at",
          page: params?.page ?? 1,
          limit: params?.limit ?? 20,
          status: params?.status,
          payment_channel: params?.payment_channel,
          search: params?.search,
        },
      });
      return toPaginatedResponse<Transaction>(
        response.data,
        params?.page ?? 1,
        params?.limit ?? 20,
      );
    },
    enabled: !!customerId,
  });
}

export function useCustomerCashbackWallet(customerId: string) {
  return useQuery({
    queryKey: queryKeys.customerCashbackWallet(customerId),
    queryFn: async () => {
      try {
        const response = await apiClient.get<CashbackWallet>(
          `/api/v1/cashback/balance?user_id=${customerId}`,
        );
        return extractOne<CashbackWallet>(response.data);
      } catch {
        const response = await apiClient.get<
          | PaginatedResponse<CashbackWallet>
          | ApiCollectionResponse<CashbackWallet>
          | CashbackWallet[]
        >(`/api/v1/cashback/balance?user_id=${customerId}`, {
          params: { user_id: customerId },
        });
        const wallet = extractOne<CashbackWallet>(response.data);
        return wallet ?? null;
      }
    },
    enabled: !!customerId,
  });
}

export function useCustomerCashbackLedger(customerId: string) {
  return useQuery({
    queryKey: queryKeys.customerCashbackLedger(customerId),
    queryFn: async () => {
      try {
        const response = await apiClient.get<
          | PaginatedResponse<CashbackLedger>
          | ApiCollectionResponse<CashbackLedger>
        >(`/api/v1/cashback/earned?user_id=${customerId}`);
        return extractCollection<CashbackLedger>(response.data);
      } catch {
        const response = await apiClient.get<
          | PaginatedResponse<CashbackLedger>
          | ApiCollectionResponse<CashbackLedger>
        >("/api/v1/cashback-ledger", { params: { user_id: customerId } });
        return extractCollection<CashbackLedger>(response.data);
      }
    },
    enabled: !!customerId,
  });
}

export function useBanCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerId: string) => {
      try {
        const response = await apiClient.patch(
          `/api/v1/users/${customerId}/ban`,
        );
        return response.data;
      } catch {
        const response = await apiClient.patch(
          `/api/v1/users/${customerId}/status`,
          {
            status: "banned",
          },
        );
        return response.data;
      }
    },
    onSuccess: (_, customerId) => {
      toast.success("Customer banned successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.customers });
      queryClient.invalidateQueries({
        queryKey: queryKeys.customer(customerId),
      });
    },
    onError: (error: any) => {
      toast.error(safeErrorMessage(error, "Failed to ban customer"));
    },
  });
}

export function useUpdateCustomerLoanStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      customerId: string;
      loan_status: "active" | "inactive" | "banned" | "suspended";
    }) => {
      try {
        const response = await apiClient.patch(
          `/api/v1/users/${payload.customerId}/loan-status`,
          {
            loan_status: payload.loan_status,
          },
        );
        return response.data;
      } catch {
        const response = await apiClient.patch(
          `/api/v1/users/${payload.customerId}`,
          {
            loan_status: payload.loan_status,
          },
        );
        return response.data;
      }
    },
    onSuccess: (_, payload) => {
      toast.success("Customer loan status updated");
      queryClient.invalidateQueries({ queryKey: queryKeys.customers });
      queryClient.invalidateQueries({
        queryKey: queryKeys.customer(payload.customerId),
      });
    },
    onError: (error: any) => {
      toast.error(safeErrorMessage(error, "Failed to update loan status"));
    },
  });
}

// ==============================================
// TRANSACTIONS
// ==============================================

export function useTransactions(params?: TransactionQueryParams) {
  return useQuery({
    queryKey: [...queryKeys.transactions, params],
    queryFn: async () => {
      const response = await apiClient.get<
        | PaginatedResponse<Transaction>
        | ApiCollectionResponse<Transaction>
        | Transaction[]
      >("/api/v1/transactions", { params });
      return toPaginatedResponse<Transaction>(
        response.data,
        params?.page ?? 1,
        params?.limit ?? 20,
      );
    },
  });
}

// ==============================================
// Loan Types
// ==============================================
export function useLoanTypes() {
  return useQuery({
    queryKey: queryKeys.loanTypes,
    queryFn: async () => {
      const response =
        await apiClient.get<ApiCollectionResponse<LoanType>>(
          "/api/v1/loan-types",
        );
      return extractCollection<LoanType>(response.data);
    },
  });
}

// ==============================================
// Loan Categories
// ==============================================
export function useLoanCategories() {
  return useQuery({
    queryKey: queryKeys.loanCategories,
    queryFn: async () => {
      const response =
        await apiClient.get<ApiCollectionResponse<LoanCategory>>(
          "/api/v1/categories",
        );
      return extractCollection<LoanCategory>(response.data);
    },
  });
}

// ==============================================
// Loan Analysis (for dashboard)
// ==============================================
export function useLoanAnalysis() {
  return useCompleteAnalysis();
}

// ==============================================
// Activity Log
// ==============================================
export function useActivityLog(limit: number = 50) {
  return useQuery({
    queryKey: [...queryKeys.activityLog, limit],
    queryFn: async () => {
      try {
        const response = await apiClient.get<PaginatedResponse<ActivityLog>>(
          `/api/v1/activities?limit=${limit}`,
        );
        return response.data.docs;
      } catch {
        return [];
      }
    },
    refetchInterval: 60000,
  });
}
