export const COMPANY_CODE = 'AC-2024-7891';

export type DriverStatus = 'active' | 'break' | 'offline';
export type AlertSeverity = 'high' | 'medium' | 'low';
export type TripStatus = 'active' | 'completed';
export type TicketStatus = 'open' | 'in-progress' | 'resolved';
export type TicketPriority = 'high' | 'medium' | 'low';

export interface Driver {
  id: string;
  initials: string;
  name: string;
  email: string;
  phone: string;
  driverId: string;
  status: DriverStatus;
  totalTrips: number;
  todayAlerts: number;
  safetyScore: number;
  currentRoute?: string;
  tripDuration?: string;
  color: string;
}

export interface Alert {
  id: string;
  type: string;
  icon: string;
  driverName: string;
  driverId: string;
  tripId: string;
  location: string;
  duration: string;
  time: string;
  severity: AlertSeverity;
  action: string;
}

export interface Trip {
  id: string;
  driverInitials: string;
  driverName: string;
  driverColor: string;
  route: string;
  startTime: string;
  duration: string;
  alerts: number;
  alertLevel: 'high' | 'medium' | 'low' | 'none';
  status: TripStatus;
}

export interface Ticket {
  id: string;
  driverInitials: string;
  driverName: string;
  driverColor: string;
  title: string;
  date: string;
  priority: TicketPriority;
  status: TicketStatus;
}

export interface PendingDriver {
  id: string;
  name: string;
  email: string;
}

export const drivers: Driver[] = [
  {
    id: '1', initials: 'JS', name: 'John Smith', email: 'john.smith@email.com',
    phone: '+1 (555) 123-4567', driverId: 'DRV-001', status: 'active',
    totalTrips: 127, todayAlerts: 8, safetyScore: 92,
    currentRoute: 'Highway 101', tripDuration: '45 min', color: '#4F7DF3',
  },
  {
    id: '2', initials: 'SJ', name: 'Sarah Johnson', email: 'sarah.j@email.com',
    phone: '+1 (555) 234-5678', driverId: 'DRV-002', status: 'active',
    totalTrips: 143, todayAlerts: 3, safetyScore: 96,
    currentRoute: 'Route 45', tripDuration: '1h 12m', color: '#7c5df9',
  },
  {
    id: '3', initials: 'MD', name: 'Mike Davis', email: 'mike.davis@email.com',
    phone: '+1 (555) 345-6789', driverId: 'DRV-003', status: 'active',
    totalTrips: 98, todayAlerts: 5, safetyScore: 88,
    currentRoute: 'Main Street', tripDuration: '23 min', color: '#10b981',
  },
  {
    id: '4', initials: 'EB', name: 'Emily Brown', email: 'emily.b@email.com',
    phone: '+1 (555) 456-7890', driverId: 'DRV-004', status: 'break',
    totalTrips: 156, todayAlerts: 1, safetyScore: 98,
    color: '#f59e0b',
  },
  {
    id: '5', initials: 'RW', name: 'Robert Wilson', email: 'robert.w@email.com',
    phone: '+1 (555) 567-8901', driverId: 'DRV-005', status: 'active',
    totalTrips: 89, todayAlerts: 2, safetyScore: 91,
    currentRoute: 'Interstate 5', tripDuration: '1h 3m', color: '#ef4444',
  },
  {
    id: '6', initials: 'LC', name: 'Laura Chen', email: 'laura.c@email.com',
    phone: '+1 (555) 678-9012', driverId: 'DRV-006', status: 'offline',
    totalTrips: 112, todayAlerts: 0, safetyScore: 99,
    color: '#6b7280',
  },
];

export const alerts: Alert[] = [
  {
    id: 'a1', type: 'Phone Usage', icon: 'phone', driverName: 'John Smith', driverId: 'DRV-001',
    tripId: 'TRP-2401', location: 'Highway 101, Mile 47.3', duration: '8 seconds',
    time: '2 minutes ago', severity: 'high', action: 'Driver notified via audio alert',
  },
  {
    id: 'a2', type: 'Drowsiness Detected', icon: 'drowsiness', driverName: 'Sarah Johnson', driverId: 'DRV-002',
    tripId: 'TRP-2402', location: 'Route 45, Near Exit 12', duration: '3 seconds',
    time: '15 minutes ago', severity: 'medium', action: 'Driver notified, suggested break',
  },
  {
    id: 'a3', type: 'Looking Away', icon: 'looking-away', driverName: 'Mike Davis', driverId: 'DRV-003',
    tripId: 'TRP-2403', location: 'Main Street, Downtown', duration: '4 seconds',
    time: '28 minutes ago', severity: 'low', action: 'Warning displayed on dashboard',
  },
  {
    id: 'a4', type: 'Eating / Drinking', icon: 'eating-drinking', driverName: 'Robert Wilson', driverId: 'DRV-005',
    tripId: 'TRP-2405', location: 'Interstate 5, Mile 89', duration: '12 seconds',
    time: '1 hour ago', severity: 'medium', action: 'Driver notified, reminder sent',
  },
  {
    id: 'a5', type: 'Phone Usage', icon: 'phone', driverName: 'Mike Davis', driverId: 'DRV-003',
    tripId: 'TRP-2403', location: 'Main Street, Intersection 3', duration: '5 seconds',
    time: '2 hours ago', severity: 'high', action: 'Supervisor alerted',
  },
];

export const trips: Trip[] = [
  {
    id: 'TRP-2401', driverInitials: 'JS', driverName: 'John Smith', driverColor: '#4F7DF3',
    route: 'Highway 101 → Downtown', startTime: '10:30 AM', duration: '45 min',
    alerts: 3, alertLevel: 'high', status: 'active',
  },
  {
    id: 'TRP-2402', driverInitials: 'SJ', driverName: 'Sarah Johnson', driverColor: '#7c5df9',
    route: 'Route 45 → Central Station', startTime: '9:45 AM', duration: '1h 12m',
    alerts: 1, alertLevel: 'medium', status: 'active',
  },
  {
    id: 'TRP-2403', driverInitials: 'MD', driverName: 'Mike Davis', driverColor: '#10b981',
    route: 'Main St → Airport', startTime: '10:52 AM', duration: '23 min',
    alerts: 2, alertLevel: 'low', status: 'active',
  },
  {
    id: 'TRP-2404', driverInitials: 'EB', driverName: 'Emily Brown', driverColor: '#f59e0b',
    route: 'North Ave → South Plaza', startTime: '8:15 AM', duration: '2h 8m',
    alerts: 0, alertLevel: 'none', status: 'completed',
  },
  {
    id: 'TRP-2405', driverInitials: 'RW', driverName: 'Robert Wilson', driverColor: '#ef4444',
    route: 'Interstate 5 → Warehouse', startTime: '9:00 AM', duration: '1h 3m',
    alerts: 1, alertLevel: 'medium', status: 'active',
  },
];

export const tickets: Ticket[] = [
  {
    id: '#TKT-1247', driverInitials: 'JS', driverName: 'John Smith', driverColor: '#4F7DF3',
    title: 'Camera malfunction during trip', date: 'Today, 10:45 AM',
    priority: 'high', status: 'open',
  },
  {
    id: '#TKT-1246', driverInitials: 'SJ', driverName: 'Sarah Johnson', driverColor: '#7c5df9',
    title: 'Question about alert sensitivity settings', date: 'Yesterday, 3:20 PM',
    priority: 'medium', status: 'in-progress',
  },
  {
    id: '#TKT-1245', driverInitials: 'MD', driverName: 'Mike Davis', driverColor: '#10b981',
    title: 'Request for trip history export', date: '2 days ago',
    priority: 'low', status: 'resolved',
  },
  {
    id: '#TKT-1244', driverInitials: 'EB', driverName: 'Emily Brown', driverColor: '#f59e0b',
    title: 'Audio alert volume too low', date: '3 days ago',
    priority: 'medium', status: 'resolved',
  },
];

export const pendingDrivers: PendingDriver[] = [
  { id: 'p1', name: 'James Wilson', email: 'james.w@email.com' },
  { id: 'p2', name: 'Lisa Anderson', email: 'lisa.a@email.com' },
];
