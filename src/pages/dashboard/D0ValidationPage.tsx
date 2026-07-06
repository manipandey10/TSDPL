import { useOutletContext } from 'react-router-dom';
import { Idea } from '../../lib/supabase';
import { CheckCircle2, Clock, AlertTriangle, FileCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface OutletContextType {
  ideas: Idea[];
  refreshIdeas: () => void;
}

export default function D0ValidationPage() {
  const { ideas, refreshIdeas } = useOutletContext<OutletContextType>();
  const { profile } = useAuth();
  const pendingValidation = ideas.filter(i => i.current_stage === 'idea_info' || i.current_stage === 'd0_validation');
  const completedValidation = ideas.filter(i => i.current_stage !== 'idea_info' && i.current_stage !== 'd0_validation');

  const handleApprove = async (idea: Idea) => {
    if (!confirm(`Approve "${idea.project_name}" and move to D1 scoring?`)) return;
    const { error } = await supabase
      .from('ideas')
      .update({ current_stage: 'd1_scoring', status: 'd1_scoring', updated_at: new Date().toISOString() })
      .eq('id', idea.id);

    if (!error) {
      // log activity
      await supabase.from('activity_logs').insert({ user_id: profile?.id ?? null, action: 'd0_approved', entity_type: 'idea', entity_id: idea.id, details: { project_id: idea.project_id } });
      refreshIdeas();
    } else {
      console.error('Approve failed:', error);
      alert('Failed to approve idea. Check console for details.');
    }
  };

  const handleReject = async (idea: Idea) => {
    if (!confirm(`Reject "${idea.project_name}"? This will mark the idea as rejected.`)) return;
    const { error } = await supabase
      .from('ideas')
      .update({ current_stage: 'idea_info', status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', idea.id);

    if (!error) {
      await supabase.from('activity_logs').insert({ user_id: profile?.id ?? null, action: 'd0_rejected', entity_type: 'idea', entity_id: idea.id, details: { project_id: idea.project_id } });
      refreshIdeas();
    } else {
      console.error('Reject failed:', error);
      alert('Failed to reject idea. Check console for details.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Pending</p>
              <p className="text-xl font-bold text-white">{pendingValidation.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Completed</p>
              <p className="text-xl font-bold text-white">{completedValidation.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Validated</p>
              <p className="text-xl font-bold text-white">{ideas.filter(i => i.d0_lever).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Issues</p>
              <p className="text-xl font-bold text-white">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Validation List */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl">
        <div className="px-6 py-4 border-b border-slate-700/50">
          <h3 className="text-lg font-semibold text-white">D0 Validation Queue</h3>
        </div>
        <div className="divide-y divide-slate-700/50">
          {pendingValidation.length > 0 ? (
            pendingValidation.map((idea) => (
              <div key={idea.id} className="p-4 hover:bg-slate-700/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{idea.project_name}</p>
                    <p className="text-sm text-slate-400">{idea.project_id}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {idea.d0_lever ? (
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm">
                        {idea.d0_lever}
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm">
                        Awaiting
                      </span>
                    )}
                    {profile?.role === 'admin' ? (
                      <>
                        <button onClick={() => handleApprove(idea)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors">
                          Approve
                        </button>
                        <button onClick={() => handleReject(idea)} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm transition-colors">
                          Reject
                        </button>
                      </>
                    ) : (
                      <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors">
                        Validate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400">
              All ideas have been validated
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
