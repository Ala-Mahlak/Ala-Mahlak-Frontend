import { useQuery } from '@tanstack/react-query';
import {
  alerts,
  conversations,
  drivers,
  tickets,
  trips,
} from '../data/mockData';
import {
  getCompanyAdminCandidates,
  getCompanyAdmins,
  getCompanyDriverReport,
  getCompanyDrivers,
  getCompanyTrips,
  type CompanyAdmin,
  type CompanyDriver,
  type CompanyTrip,
} from '../services/authService';

export const appQueryKeys = {
  dashboard: ['dashboard-data'] as const,
  alerts: ['alerts-data'] as const,
  trips: ['trip-monitoring-data'] as const,
  support: ['support-data'] as const,
  companyDrivers: ['company-drivers'] as const,
  companyTrips: ['company-trips'] as const,
  companyAdmins: (search: string) => ['company-admins', search] as const,
  companyAdminCandidates: ['company-admin-candidates'] as const,
  companyDriverReport: (startDate: string, endDate: string) => ['company-driver-report', startDate, endDate] as const,
};

type DashboardData = {
  alerts: typeof alerts;
  drivers: typeof drivers;
};

type SupportData = {
  conversations: typeof conversations;
  tickets: typeof tickets;
};

const cloneSupportData = (): SupportData => ({
  conversations: conversations.map(conversation => ({
    ...conversation,
    messages: conversation.messages.map(message => ({ ...message })),
  })),
  tickets: tickets.map(ticket => ({ ...ticket })),
});

export function useDashboardData() {
  return useQuery<DashboardData>({
    queryKey: appQueryKeys.dashboard,
    queryFn: async () => ({ alerts, drivers }),
    staleTime: Infinity,
    initialData: { alerts, drivers },
  });
}

export function useAlertsData() {
  return useQuery({
    queryKey: appQueryKeys.alerts,
    queryFn: async () => alerts,
    staleTime: Infinity,
    initialData: alerts,
  });
}

export function useTripMonitoringData() {
  return useQuery({
    queryKey: appQueryKeys.trips,
    queryFn: async () => ({ trips, alerts }),
    staleTime: Infinity,
    initialData: { trips, alerts },
  });
}

export function useSupportData() {
  return useQuery<SupportData>({
    queryKey: appQueryKeys.support,
    queryFn: async () => cloneSupportData(),
    staleTime: Infinity,
    initialData: cloneSupportData(),
  });
}

export function useCompanyDriversQuery() {
  return useQuery<CompanyDriver[]>({
    queryKey: appQueryKeys.companyDrivers,
    queryFn: getCompanyDrivers,
  });
}

export function useCompanyTripsQuery() {
  return useQuery<CompanyTrip[]>({
    queryKey: appQueryKeys.companyTrips,
    queryFn: getCompanyTrips,
  });
}

export function useCompanyAdminsQuery(search: string) {
  return useQuery<CompanyAdmin[]>({
    queryKey: appQueryKeys.companyAdmins(search),
    queryFn: () => getCompanyAdmins(search || undefined),
  });
}

export function useCompanyAdminCandidatesQuery() {
  return useQuery({
    queryKey: appQueryKeys.companyAdminCandidates,
    queryFn: getCompanyAdminCandidates,
  });
}

export function useCompanyDriverReportQuery(startDate: string, endDate: string) {
  return useQuery({
    queryKey: appQueryKeys.companyDriverReport(startDate, endDate),
    queryFn: () => getCompanyDriverReport({ startDate: `${startDate}T00:00:00.000Z`, endDate: `${endDate}T00:00:00.000Z` }),
    enabled: false,
  });
}