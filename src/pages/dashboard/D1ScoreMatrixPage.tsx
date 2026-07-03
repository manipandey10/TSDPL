import { useOutletContext } from 'react-router-dom';
import { Idea } from '../../lib/supabase';
import { Calculator, TrendingUp, Award, Target } from 'lucide-react';

interface OutletContextType {
  ideas: Idea[];
  refreshIdeas: () => void;
}

export default function D1ScoreMatrixPage() {
  const { ideas } = useOutletContext<OutletContextType>();
  const scoreGroups = {
    high: ideas.filter(i => i.score >= 80),
    medium: ideas.filter(i => i.score >= 50 && i.score < 80),
    low: ideas.filter(i => i.score > 0 && i.score < 50),
  };

  const matrixData = ideas.map(idea => ({
    name: idea.project_name,
    impact: idea.estimated_impact === 'high' ? 3 : idea.estimated_impact === 'medium' ? 2 : 1,
    effort: idea.implementability === 'quick_win' ? 1 : idea.implementability === 'mid_effort' ? 2 : 3,
    score: idea.score,
  }));

  return (
    <div className="space-y-6">
      {/* Score Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Calculator className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Avg Score</p>
              <p className="text-xl font-bold text-white">
                {ideas.length > 0 ? Math.round(ideas.reduce((a, i) => a + i.score, 0) / ideas.length) : 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">High Score</p>
              <p className="text-xl font-bold text-white">{scoreGroups.high.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Medium Score</p>
              <p className="text-xl font-bold text-white">{scoreGroups.medium.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Low Score</p>
              <p className="text-xl font-bold text-white">{scoreGroups.low.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Matrix Chart */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Impact vs Effort Matrix</h3>
        <div className="relative h-80 border border-slate-600 rounded-lg">
          {/* Grid lines */}
          <div className="absolute w-full h-px bg-slate-600 top-1/2" />
          <div className="absolute h-full w-px bg-slate-600 left-1/2" />
          {/* Quadrant labels */}
          <div className="absolute top-4 left-4 text-xs text-green-400">High Impact, Low Effort</div>
          <div className="absolute top-4 right-4 text-xs text-blue-400">High Impact, High Effort</div>
          <div className="absolute bottom-4 left-4 text-xs text-slate-400">Low Impact, Low Effort</div>
          <div className="absolute bottom-4 right-4 text-xs text-slate-400">Low Impact, High Effort</div>
          {/* Points */}
          {matrixData.map((item, index) => (
            <div
              key={index}
              className="absolute w-4 h-4 rounded-full bg-blue-500 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-150 transition-transform"
              style={{
                left: `${(item.effort / 3) * 100}%`,
                top: `${100 - (item.impact / 3) * 100}%`,
              }}
              title={item.name}
            />
          ))}
        </div>
      </div>

      {/* Score Table */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50">
          <h3 className="text-lg font-semibold text-white">Score Rankings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="px-6 py-3 text-left text-xs text-slate-400 uppercase">Project</th>
                <th className="px-6 py-3 text-left text-xs text-slate-400 uppercase">Impact</th>
                <th className="px-6 py-3 text-left text-xs text-slate-400 uppercase">Effort</th>
                <th className="px-6 py-3 text-left text-xs text-slate-400 uppercase">Score</th>
                <th className="px-6 py-3 text-left text-xs text-slate-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {ideas.slice(0, 10).map((idea) => (
                <tr key={idea.id} className="hover:bg-slate-700/30">
                  <td className="px-6 py-4 text-white">{idea.project_name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-sm ${
                      idea.estimated_impact === 'high' ? 'text-green-400' :
                      idea.estimated_impact === 'medium' ? 'text-yellow-400' : 'text-slate-400'
                    }`}>
                      {idea.estimated_impact || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300">{idea.implementability || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${idea.score >= 80 ? 'bg-green-500' : idea.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${idea.score}%` }}
                        />
                      </div>
                      <span className="text-slate-300 text-sm">{idea.score}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      idea.score >= 80 ? 'bg-green-500/20 text-green-400' :
                      idea.score >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {idea.score >= 80 ? 'Excellent' : idea.score >= 50 ? 'Good' : 'Needs Improvement'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
