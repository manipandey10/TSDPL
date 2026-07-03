import { useOutletContext } from 'react-router-dom';
import { Idea } from '../../lib/supabase';
import { Grid3X3, Eye, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface OutletContextType {
  ideas: Idea[];
  refreshIdeas: () => void;
}

export default function ProjectsPage() {
  const { ideas } = useOutletContext<OutletContextType>();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'rejected': return <AlertCircle className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getImpactColor = (impact: string | null) => {
    if (impact === 'high') return 'border-green-500/50 bg-green-500/10';
    if (impact === 'medium') return 'border-yellow-500/50 bg-yellow-500/10';
    return 'border-slate-600 bg-slate-700/30';
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <p className="text-sm text-slate-400">Total Projects</p>
          <p className="text-2xl font-bold text-white">{ideas.length}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <p className="text-sm text-slate-400">In Progress</p>
          <p className="text-2xl font-bold text-blue-400">{ideas.filter(i => !['approved', 'rejected', 'completed'].includes(i.status)).length}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <p className="text-sm text-slate-400">Approved</p>
          <p className="text-2xl font-bold text-green-400">{ideas.filter(i => i.status === 'approved').length}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <p className="text-sm text-slate-400">High Impact</p>
          <p className="text-2xl font-bold text-cyan-400">{ideas.filter(i => i.estimated_impact === 'high').length}</p>
        </div>
      </div>

      {/* Project Grid */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Grid3X3 className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Project Grid</h3>
        </div>

        {ideas.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {ideas.map((idea) => (
              <div
                key={idea.id}
                className={`border rounded-xl p-4 hover:border-slate-500 transition-all cursor-pointer group ${getImpactColor(idea.estimated_impact)}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-mono text-blue-400">{idea.project_id}</span>
                  {getStatusIcon(idea.status)}
                </div>
                <h4 className="text-white font-medium mb-2 group-hover:text-blue-400 transition-colors">
                  {idea.project_name}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-2 mb-3">{idea.description || 'No description'}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{idea.current_stage.replace(/_/g, ' ')}</span>
                  <span className={`px-2 py-0.5 rounded-full ${
                    idea.estimated_impact === 'high' ? 'bg-green-500/20 text-green-400' :
                    idea.estimated_impact === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-slate-600/20 text-slate-400'
                  }`}>
                    {idea.estimated_impact || 'N/A'}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Score</span>
                    <span className="text-xs text-slate-300">{idea.score}/100</span>
                  </div>
                  <div className="mt-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                      style={{ width: `${idea.score}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Grid3X3 className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-slate-400">No projects yet</p>
            <p className="text-sm text-slate-500 mt-1">Submit your first idea to see it here</p>
          </div>
        )}
      </div>
    </div>
  );
}
