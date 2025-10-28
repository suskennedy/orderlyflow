import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './useAuth';

interface DashboardStats {
  homes: {
    total: number;
  };
  tasks: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
  vendors: {
    total: number;
  };
  inventory: {
    total: number;
    expiringWarranties: number;
  };
}

interface RecentActivity {
  id: string;
  type: 'home' | 'task' | 'vendor' | 'inventory';
  title: string;
  subtitle?: string;
  timestamp: string;
  icon: string;
}

export function useDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    homes: { total: 0 },
    tasks: { total: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0 },
    vendors: { total: 0 },
    inventory: { total: 0, expiringWarranties: 0 },
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Fetch all data in parallel
      const [
        homesResponse,
        homeTasksResponse,
        vendorsResponse,
        appliancesResponse,
      ] = await Promise.all([
        supabase
          .from('homes')
          .select('id, name, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('home_tasks')
          .select('id, title, status, due_date, created_at, priority')
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('vendors')
          .select('id, name, created_at, category')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('appliances')
          .select('id, name, warranty_expiration, created_at')
          .order('created_at', { ascending: false }),
      ]);

      const homes = homesResponse.data || [];
      const tasks = homeTasksResponse.data || [];
      const vendors = vendorsResponse.data || [];
      const inventory = appliancesResponse.data || [];

      // Calculate task stats
      const today = new Date().toISOString().split('T')[0];
      const taskStats = {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        overdue: tasks.filter(t => 
          t.status !== 'completed' && 
          t.due_date && 
          t.due_date < today
        ).length,
      };

      // Calculate expiring warranties (within 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const expiringWarranties = inventory.filter(item => 
        item.warranty_expiration && 
        new Date(item.warranty_expiration) <= thirtyDaysFromNow &&
        new Date(item.warranty_expiration) >= new Date()
      ).length;

      setStats({
        homes: { total: homes.length },
        tasks: taskStats,
        vendors: { total: vendors.length },
        inventory: { 
          total: inventory.length,
          expiringWarranties 
        },
      });

      // Build recent activity
      const activities: RecentActivity[] = [];
      
      // Add recent homes
      homes.slice(0, 2).forEach(home => {
        activities.push({
          id: home.id,
          type: 'home',
          title: home.name,
          subtitle: 'New home added',
          timestamp: home.created_at || '',
          icon: 'business',
        });
      });

      // Add recent tasks
      tasks.slice(0, 3).forEach(task => {
        activities.push({
          id: task.id,
          type: 'task',
          title: task.title,
          subtitle: `${task.status}${task.priority ? ` • ${task.priority} priority` : ''}`,
          timestamp: task.created_at || '',
          icon: 'checkbox',
        });
      });

      // Add recent vendors
      vendors.slice(0, 2).forEach(vendor => {
        activities.push({
          id: vendor.id,
          type: 'vendor',
          title: vendor.name,
          subtitle: vendor.category || 'New vendor added',
          timestamp: vendor.created_at || '',
          icon: 'people',
        });
      });

      // Add recent inventory
      inventory.slice(0, 2).forEach(item => {
        activities.push({
          id: item.id,
          type: 'inventory',
          title: item.name,
          subtitle: 'New item added',
          timestamp: item.created_at || '',
          icon: 'cube',
        });
      });

      // Sort by timestamp and limit to 8 items
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activities.slice(0, 8));

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  const refreshStats = async () => {
    setRefreshing(true);
    await fetchDashboardStats();
  };

  useEffect(() => {
    if (user?.id) {
      fetchDashboardStats();
    }
  }, [user?.id, fetchDashboardStats]);

  return {
    stats,
    recentActivity,
    loading,
    refreshing,
    refreshStats,
    fetchDashboardStats, // Expose this for manual refresh after adding items
  };
} 