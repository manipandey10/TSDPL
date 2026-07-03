import { useOutletContext } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { TrendingUp, BarChart3, PieChart } from 'lucide-react';
import { Idea } from '../../lib/supabase';

interface OutletContextType {
  ideas: Idea[];
  refreshIdeas: () => void;
}

const performanceData = [
  { month: 'Jan', efficiency: 78, quality: 85, delivery: 92 },
  { month: 'Feb', efficiency: 82, quality: 88, delivery: 90 },
  { month: 'Mar', efficiency: 85, quality: 87, delivery: 95 },
  { month: 'Apr', efficiency: 83, quality: 91, delivery: 88 },
  { month: 'May', efficiency: 88, quality: 93, delivery: 94 },
  { month: 'Jun', efficiency: 92, quality: 95, delivery: 96 },
];

const radarData = [
  { subject: 'Innovation', A: 85, fullMark: 100 },
  { subject: 'Efficiency', A: 78, fullMark: 100 },
  { subject: 'Quality', A: 92, fullMark: 100 },
  { subject: 'Timeliness', A: 88, fullMark: 100 },
  { subject: 'Cost Control', A: 75, fullMark: 100 },
  { subject: 'Team Work', A: 90, fullMark: 100 },
];

const categoryData = [
  { name: 'Cost Reduction', count: 24 },
  { name: 'Revenue Growth', count: 18 },
  { name: 'Efficiency', count: 32 },
  { name: 'Quality', count: 15 },
  { name: 'Innovation', count: 21 },
];

export default function AnalyticsPage() {
  const { ideas } = useOutletContext<OutletContextType>();

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Submissions</p>
              <p className="text-2xl font-bold text-white">{ideas.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-400">
            <TrendingUp className="w-4 h-4" />
            <span>12% increase</span>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Avg Score</p>
              <p className="text-2xl font-bold text-white">78.5</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-400">
            <TrendingUp className="w-4 h-4" />
            <span>5% improvement</span>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <PieChart className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Approval Rate</p>
              <p className="text-2xl font-bold text-white">68%</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-red-400">
            <TrendingUp className="w-4 h-4 transform rotate-180" />
            <span>3% decrease</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Line Chart */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="efficiency" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6' }} />
                <Line type="monotone" dataKey="quality" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981' }} />
                <Line type="monotone" dataKey="delivery" stroke="#F59E0B" strokeWidth={2} dot={{ fill: '#F59E0B' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Capabilities Overview</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <PolarRadiusAxis tick={{ fill: '#94A3B8' }} />
                <Radar name="Current" dataKey="A" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Bar Chart */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Ideas by Category</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" stroke="#94A3B8" fontSize={12} />
              <YAxis type="category" dataKey="name" stroke="#94A3B8" fontSize={12} width={100} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
