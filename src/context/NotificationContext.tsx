import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getJoinRequests, getCompanyTrips, type JoinRequest, type CompanyTrip } from '../services/authService';

export interface NotificationItem {
  id: string;
  type: 'alert' | 'assignment' | 'trip';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  addNotification: (type: 'alert' | 'assignment' | 'trip', title: string, message: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Keep track of known entities to prevent duplicate alerts on page loads
  const knownRequestIds = useRef<Set<string>>(new Set());
  const knownTrips = useRef<Map<number, { endTime?: string; totalAlerts: number }>>(new Map());
  const isFirstLoad = useRef(true);

  const addNotification = useCallback((type: 'alert' | 'assignment' | 'trip', title: string, message: string) => {
    const newItem: NotificationItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };
    setNotifications(prev => [newItem, ...prev]);

    // Show a desktop notification or native browser alert if permission is granted
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body: message });
      }
    } catch (e) {
      console.error('Failed to show notification', e);
    }
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Real-time backend polling for alerts, new trips, and join requests
  useEffect(() => {
    if (!isLoggedIn) {
      setNotifications([]);
      knownRequestIds.current.clear();
      knownTrips.current.clear();
      isFirstLoad.current = true;
      return;
    }

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const checkRealTimeEvents = async () => {
      try {
        // 1. Fetch live join requests and trips
        const [requests, trips] = await Promise.all([
          getJoinRequests().catch(() => [] as JoinRequest[]),
          getCompanyTrips().catch(() => [] as CompanyTrip[]),
        ]);

        // If it's the first time we load the page, just record existing data as "known" without notifying
        if (isFirstLoad.current) {
          requests.forEach(r => knownRequestIds.current.add(r.id));
          trips.forEach(t => knownTrips.current.set(t.id, { endTime: t.endTime, totalAlerts: t.totalAlerts }));
          isFirstLoad.current = false;
          return;
        }

        // 2. Check for new join requests
        requests.forEach(r => {
          if (!knownRequestIds.current.has(r.id)) {
            knownRequestIds.current.add(r.id);
            // Notify only if request is pending
            if (r.status.toLowerCase() === 'pending' && !r.approved) {
              addNotification(
                'assignment',
                'New Join Request',
                `Driver ${r.userName} has requested to join your company.`
              );
            }
          }
        });

        // 3. Check for new trips, completed trips, and safety alerts
        trips.forEach(t => {
          const knownTrip = knownTrips.current.get(t.id);

          if (!knownTrip) {
            // This is a brand new active trip
            knownTrips.current.set(t.id, { endTime: t.endTime, totalAlerts: t.totalAlerts });
            addNotification(
              'trip',
              'Trip Started',
              `Driver ${t.driverName} has started a new trip: ${t.origin || 'Unknown'} → ${t.destination || 'Unknown'}`
            );
          } else {
            // Check if trip just completed
            if (!knownTrip.endTime && t.endTime) {
              addNotification(
                'trip',
                'Trip Completed',
                `Driver ${t.driverName} has completed their trip. Distance: ${t.distanceKm.toFixed(1)} km.`
              );
            }

            // Check if there are new safety alerts triggered on this trip
            if (t.totalAlerts > knownTrip.totalAlerts) {
              const diff = t.totalAlerts - knownTrip.totalAlerts;
              addNotification(
                'alert',
                'Distraction Alert',
                `Driver ${t.driverName} triggered ${diff} new safety alert${diff > 1 ? 's' : ''} during their trip.`
              );
            }

            // Update known trip details
            knownTrips.current.set(t.id, { endTime: t.endTime, totalAlerts: t.totalAlerts });
          }
        });
      } catch (err) {
        console.error('Polling error checking real-time events:', err);
      }
    };

    // Run immediately on load/login
    checkRealTimeEvents();

    // Poll the backend APIs every 15 seconds to fetch real live data updates
    const pollInterval = setInterval(checkRealTimeEvents, 15000);

    return () => clearInterval(pollInterval);
  }, [isLoggedIn, addNotification]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
