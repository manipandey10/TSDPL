import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  Legend,
} from 'recharts';
import {
  Lightbulb,
  Clock,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  FileText,
  Activity,
  Zap,
} from 'lucide-react';
import { Idea } from '../../lib/supabase';

interface OutletContextType {
  ideas: Idea[];
  refreshIdeas: () => void;
}

interface KPICardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

function KPICard({ title, value, change, icon: Icon, color, bgColor }: KPICardProps) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600 transition-all group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium">{title}</p>
          <h3 className="text-3xl font-bold text-white mt-2">{value}</h3>
          <div className={`flex items-center gap-1 mt-2 text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            <span>{Math.abs(change)}% from last month</span>
          </div>
        </div>
        <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );
}

const monthlyData = [
  { name: 'Jan', submitted: 12, approved: 8, completed: 5 },
  { name: 'Feb', submitted: 15, approved: 10, completed: 7 },
  { name: 'Mar', submitted: 18, approved: 12, completed: 9 },
  { name: 'Apr', submitted: 14, approved: 11, completed: 8 },
  { name: 'May', submitted: 22, approved: 15, completed: 12 },
  { name: 'Jun', submitted: 25, approved: 18, completed: 15 },
];

const statusData = [
  { name: 'Submitted', value: 35, color: '#3B82F6' },
  { name: 'Under Review', value: 25, color: '#06B6D4' },
  { name: 'Pending Approval', value: 20, color: '#F59E0B' },
  { name: 'Approved', value: 15, color: '#10B981' },
  { name: 'Rejected', value: 5, color: '#EF4444' },
];

const weeklyTrend = [
  { day: 'Mon', ideas: 5, score: 45 },
  { day: 'Tue', ideas: 8, score: 62 },
  { day: 'Wed', ideas: 12, score: 78 },
  { day: 'Thu', ideas: 15, score: 85 },
  { day: 'Fri', ideas: 10, score: 70 },
  { day: 'Sat', ideas: 4, score: 35 },
  { day: 'Sun', ideas: 2, score: 20 },
];

export default function DashboardHome() {
  const { ideas } = useOutletContext<OutletContextType>();
  const [recentIdeas, setRecentIdeas] = useState<Idea[]>([]);
  const [stats, setStats] = useState({
    submitted: 0,
    underReview: 0,
    pending: 0,
    approved: 0,
    completed: 0,
  });

  useEffect(() => {
    setRecentIdeas(ideas.slice(0, 5));
    const statusCounts = ideas.reduce((acc, idea) => {
      if (idea.status in acc) {
        acc[idea.status as keyof typeof acc]++;
      }
      return acc;
    }, {
      submitted: 0,
      d0_validation: 0,
      d1_scoring: 0,
      d2_d4_workflow: 0,
      final_approval: 0,
      approved: 0,
      rejected: 0,
      completed: 0,
    });

    setStats({
      submitted: statusCounts.submitted + statusCounts.d0_validation,
      underReview: statusCounts.d1_scoring + statusCounts.d2_d4_workflow,
      pending: statusCounts.final_approval,
      approved: statusCounts.approved,
      completed: statusCounts.completed,
    });
  }, [ideas]);

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      submitted: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      d0_validation: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      d1_scoring: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      d2_d4_workflow: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      final_approval: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      approved: 'bg-green-500/20 text-green-400 border-green-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
      completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    };

    const statusLabels: Record<string, string> = {
      submitted: 'Submitted',
      d0_validation: 'D0 Validation',
      d1_scoring: 'D1 Scoring',
      d2_d4_workflow: 'D2-D4 Workflow',
      final_approval: 'Final Approval',
      approved: 'Approved',
      rejected: 'Rejected',
      completed: 'Completed',
    };

    return (
      <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${statusStyles[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <KPICard
          title="Ideas Submitted"
          value={stats.submitted}
          change={12}
          icon={Lightbulb}
          color="text-blue-400"
          bgColor="bg-blue-500/20"
        />
        <KPICard
          title="Under Review"
          value={stats.underReview}
          change={-5}
          icon={Clock}
          color="text-cyan-400"
          bgColor="bg-cyan-500/20"
        />
        <KPICard
          title="Pending Approval"
          value={stats.pending}
          change={8}
          icon={AlertCircle}
          color="text-yellow-400"
          bgColor="bg-yellow-500/20"
        />
        <KPICard
          title="Approved"
          value={stats.approved}
          change={24}
          icon={CheckCircle2}
          color="text-green-400"
          bgColor="bg-green-500/20"
        />
        <KPICard
          title="Completed"
          value={stats.completed}
          change={18}
          icon={TrendingUp}
          color="text-emerald-400"
          bgColor="bg-emerald-500/20"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart */}
        <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Workflow Trends</h3>
              <p className="text-sm text-slate-400">Monthly idea submissions & approvals</p>
            </div>
            <select className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none">
              <option>Last 6 months</option>
              <option>Last year</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#F8FAFC' }}
                />
                <Legend />
                <Area type="monotone" dataKey="submitted" stroke="#3B82F6" fill="url(#colorSubmitted)" strokeWidth={2} />
                <Area type="monotone" dataKey="approved" stroke="#10B981" fill="url(#colorApproved)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Idea Distribution</h3>
          <p className="text-sm text-slate-400 mb-4">Current status breakdown</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {statusData.slice(0, 4).map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-slate-400">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bar Chart and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Weekly Activity</h3>
              <p className="text-sm text-slate-400">Ideas and scores by day</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#F8FAFC' }}
                />
                <Legend />
                <Bar dataKey="ideas" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="score" fill="#06B6D4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-slate-700/30 rounded-xl">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Active Users</p>
                <p className="text-xl font-semibold text-white">24</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-slate-700/30 rounded-xl">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Ideas</p>
                <p className="text-xl font-semibold text-white">{ideas.length || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-slate-700/30 rounded-xl">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Avg Score</p>
                <p className="text-xl font-semibold text-white">78.5</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-slate-700/30 rounded-xl">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Quick Wins</p>
                <p className="text-xl font-semibold text-white">12</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Ideas Table */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50">
          <h3 className="text-lg font-semibold text-white">Recent Ideas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Project ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Project Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Stage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Impact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {recentIdeas.length > 0 ? (
                recentIdeas.map((idea) => (
                  <tr key={idea.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-400">{idea.project_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{idea.project_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(idea.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{idea.current_stage.replace('_', ' ').toUpperCase()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        idea.estimated_impact === 'high' ? 'bg-green-500/20 text-green-400' :
                        idea.estimated_impact === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {idea.estimated_impact || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {new Date(idea.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No ideas submitted yet. Click "Submit Idea" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
