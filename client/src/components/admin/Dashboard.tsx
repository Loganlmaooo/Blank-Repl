import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardStat {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  change?: {
    value: number;
    isPositive: boolean;
  };
}

interface ActivityItem {
  id: number;
  type: string;
  description: string;
  timestamp: string;
  icon: string;
}

export default function Dashboard() {
  const { data: stats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/stats");
      const data = await res.json();
      return {
        viewers: data.currentViewers?.viewers || 0,
        visits: data.visits || 0,
        announcements: data.announcements || 0
      };
    },
  });
  
  const { data: recentActivity = [], isLoading: activityLoading } = useQuery({
    queryKey: ['/api/admin/activity'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/activity");
      return res.json();
    },
  });
  
  const { data: viewerData = [], isLoading: viewerDataLoading } = useQuery({
    queryKey: ['/api/admin/metrics/viewers'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/metrics/viewers");
      return res.json();
    },
  });
  
  // Default stats if data is loading
  const defaultStats: DashboardStat[] = [
    {
      label: "Current Viewers",
      value: statsLoading ? "-" : (stats.viewers || 0),
      icon: "users",
      color: "bg-[#6441A4]/30 text-[#6441A4]",
    },
    {
      label: "Website Visits",
      value: statsLoading ? "-" : (stats.visits || 0),
      icon: "chart-line",
      color: "bg-blue-500/30 text-blue-400",
    },
    {
      label: "Announcements",
      value: statsLoading ? "-" : (stats.announcements || 0),
      icon: "bell",
      color: "bg-primary/30 text-primary",
    },
  ];
  
  return (
    <div className="space-y-6 animate-fadeIn">
      <h2 className="text-2xl font-bold mb-6 text-primary">Dashboard</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {defaultStats.map((stat, index) => (
          <Card key={index} className="glass hover-gold">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${stat.color} mr-4`}>
                  <i className={`fas fa-${stat.icon} text-xl`}></i>
                </div>
                <div>
                  <h3 className="text-sm text-gray-400">{stat.label}</h3>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  {stat.change && (
                    <p className={`text-xs ${stat.change.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      <i className={`fas fa-arrow-${stat.change.isPositive ? 'up' : 'down'} mr-1`}></i>
                      {Math.abs(stat.change.value)}% from last week
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Viewer Chart */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Viewer Trends</CardTitle>
          <CardDescription>Viewer count over the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {viewerDataLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={viewerData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280"
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    tickLine={false}
                    axisLine={false}
                  />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(23, 23, 23, 0.9)',
                      borderColor: '#D4AF37',
                      borderRadius: '0.375rem',
                      color: '#f9fafb'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="viewers" 
                    stroke="#D4AF37" 
                    fillOpacity={1} 
                    fill="url(#colorUv)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Recent Activity */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions and events on the site</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activityLoading ? (
              <div className="h-40 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <i className="fas fa-info-circle text-2xl mb-2"></i>
                <p>No recent activity to display</p>
              </div>
            ) : (
              recentActivity.map((item: ActivityItem) => (
                <div key={item.id} className="pb-3 border-b border-zinc-700">
                  <div className="flex justify-between">
                    <span>
                      <i className={`fas fa-${item.icon} text-primary mr-2`}></i> {item.description}
                    </span>
                    <span className="text-sm text-gray-400">
                      {new Date(item.timestamp).toLocaleString('en-US', { 
                        timeZone: 'America/New_York',
                        dateStyle: 'short',
                        timeStyle: 'short'
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
