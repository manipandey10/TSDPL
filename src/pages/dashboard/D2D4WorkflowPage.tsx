import { useOutletContext } from 'react-router-dom';
import { Idea } from '../../lib/supabase';
import { ArrowRight, CheckCircle2, Circle, GitBranch } from 'lucide-react';

interface OutletContextType {
  ideas: Idea[];
  refreshIdeas: () => void;
}

const d2d4Stages = [
  { id: 'd2', name: 'D2 - Define', description: 'Define detailed implementation plan' },
  { id: 'd3', name: 'D3 - Develop', description: 'Develop solution components' },
  { id: 'd4', name: 'D4 - Deploy', description: 'Deploy and monitor results' },
];

export default function D2D4WorkflowPage() {
  const { ideas } = useOutletContext<OutletContextType>();
  const activeWorkflows = ideas.filter(i => i.current_stage === 'd2_d4_workflow');

  return (
    <div className="space-y-6">
      {/* Workflow Overview */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6">D2-D4 Workflow Process</h3>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          {d2d4Stages.map((stage, index) => (
            <div key={stage.id} className="flex items-center gap-4">
              <div className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    {index === d2d4Stages.length - 1 ? <CheckCircle2 className="w-4 h-4 text-blue-400" /> : <Circle className="w-4 h-4 text-blue-400" />}
                  </div>
                  <h4 className="text-white font-medium">{stage.name}</h4>
                </div>
                <p className="text-sm text-slate-400">{stage.description}</p>
              </div>
              {index < d2d4Stages.length - 1 && (
                <ArrowRight className="hidden md:block w-5 h-5 text-slate-500" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Active Projects */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl">
        <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-400" />
            Active D2-D4 Projects
          </h3>
          <span className="text-sm text-slate-400">{activeWorkflows.length} projects in workflow</span>
        </div>
        <div className="divide-y divide-slate-700/50">
          {activeWorkflows.length > 0 ? (
            activeWorkflows.map((idea) => (
              <div key={idea.id} className="p-6 hover:bg-slate-700/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-mono text-blue-400">{idea.project_id}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        idea.estimated_impact === 'high' ? 'bg-green-500/20 text-green-400' :
                        idea.estimated_impact === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {idea.estimated_impact} impact
                      </span>
                    </div>
                    <h4 className="text-white font-medium mb-2">{idea.project_name}</h4>
                    <p className="text-sm text-slate-400 mb-4">{idea.description || 'No description'}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Score:</span>
                        <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                            style={{ width: `${idea.score}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400">{idea.score}</span>
                      </div>
                      <span className="text-xs text-slate-500">| </span>
                      <span className="text-cyan-400 ml-1">{idea.implementability || 'Unknown effort'}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors">
                      Update Progress
                    </button>
                    <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400">
              No projects currently in D2-D4 workflow
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
