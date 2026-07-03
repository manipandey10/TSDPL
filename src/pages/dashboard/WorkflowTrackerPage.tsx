import { useOutletContext } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ArrowRight, Clock, CheckCircle2, AlertTriangle, GitBranch } from 'lucide-react';
import { Idea } from '../../lib/supabase';

interface OutletContextType {
  ideas: Idea[];
  refreshIdeas: () => void;
}

const stageColors: Record<string, string> = {
  idea_info: '#3B82F6',
  d0_validation: '#06B6D4',
  d1_scoring: '#F59E0B',
  d2_d4_workflow: '#8B5CF6',
  final_approval: '#10B981',
};

export default function WorkflowTrackerPage() {
  const { ideas } = useOutletContext<OutletContextType>();

  const stageData = Object.entries(
    ideas.reduce((acc, idea) => {
      acc[idea.current_stage] = (acc[idea.current_stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({
    name: name.replace(/_/g, ' ').toUpperCase(),
    value,
    color: stageColors[name] || '#64748B',
  }));

  const averageTimeData = [
    { stage: 'Idea Info', days: 1.2 },
    { stage: 'D0 Validation', days: 3.5 },
    { stage: 'D1 Scoring', days: 2.8 },
    { stage: 'D2-D4 Workflow', days: 5.2 },
    { stage: 'Final Approval', days: 1.5 },
  ];

  return (
    <div className="space-y-6">
      {/* Stage Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { name: 'Idea Info', icon: AlertTriangle, color: 'blue' },
          { name: 'D0 Validation', icon: Clock, color: 'cyan' },
          { name: 'D1 Score', icon: GitBranch, color: 'amber' },
          { name: 'D2-D4', icon: ArrowRight, color: 'purple' },
          { name: 'Final', icon: CheckCircle2, color: 'green' },
        ].map((stage) => {
          const colorClasses: Record<string, { bg: string; text: string }> = {
            blue: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
            cyan: { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
            amber: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
            purple: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
            green: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
          };
          const styles = colorClasses[stage.color] ?? colorClasses.blue;

          return (
            <div key={stage.name} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <div className={`w-8 h-8 ${styles.bg} rounded-lg flex items-center justify-center mb-2`}>
                <stage.icon className={`w-4 h-4 ${styles.text}`} />
              </div>
              <p className="text-xs text-slate-400">{stage.name}</p>
              <p className="text-2xl font-bold text-white">
                {stageData.find(d => d.name.toLowerCase().includes(stage.name.toLowerCase()))?.value || 0}
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage Distribution */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Stage Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stageData.map((entry, index) => (
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
            {stageData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-slate-400">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Average Time per Stage */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Avg. Time per Stage (days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={averageTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="stage" stroke="#94A3B8" fontSize={10} />
                <YAxis stroke="#94A3B8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                />
                <Line type="monotone" dataKey="days" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Active Workflows */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl">
        <div className="px-6 py-4 border-b border-slate-700/50">
          <h3 className="text-lg font-semibold text-white">Active Workflows</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="px-6 py-3 text-left text-xs text-slate-400 uppercase">Project</th>
                <th className="px-6 py-3 text-left text-xs text-slate-400 uppercase">Current Stage</th>
                <th className="px-6 py-3 text-left text-xs text-slate-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs text-slate-400 uppercase">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {ideas.slice(0, 5).map((idea) => {
                const stageIndex = ['idea_info', 'd0_validation', 'd1_scoring', 'd2_d4_workflow', 'final_approval'].indexOf(idea.current_stage);
                const progress = Math.round(((stageIndex + 1) / 5) * 100);
                return (
                  <tr key={idea.id} className="hover:bg-slate-700/30">
                    <td className="px-6 py-4 text-white">{idea.project_name}</td>
                    <td className="px-6 py-4 text-slate-300 capitalize">{idea.current_stage.replace(/_/g, ' ')}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        idea.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        idea.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {idea.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400">{progress}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
