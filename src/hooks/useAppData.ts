import { useQuery } from '@tanstack/react-query';
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
  companyDrivers: ['company-drivers'] as const,
  companyTrips: ['company-trips'] as const,
  companyAdmins: (search: string) => ['company-admins', search] as const,
  companyAdminCandidates: ['company-admin-candidates'] as const,
  companyDriverReport: (startDate: string, endDate: string) => ['company-driver-report', startDate, endDate] as const,
};

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