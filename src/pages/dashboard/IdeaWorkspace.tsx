import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Search,
  Info,
  CheckCircle2,
  Calculator,
  GitBranch,
  Award,
  FileDown,
  Save,
  Send,
  Edit2,
  Trash2,
  Eye,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Idea } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface OutletContextType {
  ideas: Idea[];
  refreshIdeas: () => void;
}

const workflowStages = [
  { id: 'idea_info', label: 'Idea Info', icon: Info },
  { id: 'd0_validation', label: 'D0 Validation', icon: CheckCircle2 },
  { id: 'd1_scoring', label: 'D1 Score Matrix', icon: Calculator },
  { id: 'd2_d4_workflow', label: 'D2-D4 Workflow', icon: GitBranch },
  { id: 'final_approval', label: 'Final Approval', icon: Award },
];

export default function IdeaWorkspace() {
  const { ideas, refreshIdeas } = useOutletContext<OutletContextType>();
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    project_name: '',
    description: '',
    d0_lever: '',
    estimated_impact: 'medium' as 'low' | 'medium' | 'high',
    implementability: 'mid_effort' as 'high_effort' | 'mid_effort' | 'quick_win',
    score: 0,
    status: 'submitted' as Idea['status'],
    current_stage: 'idea_info' as Idea['current_stage'],
  });

  const filteredIdeas = ideas.filter((idea) => {
    const matchesSearch = idea.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idea.project_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || idea.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSelectIdea = (idea: Idea) => {
    setSelectedIdea(idea);
    setFormData({
      project_name: idea.project_name,
      description: idea.description || '',
      d0_lever: idea.d0_lever || '',
      estimated_impact: idea.estimated_impact || 'medium',
      implementability: idea.implementability || 'mid_effort',
      score: idea.score,
      status: idea.status,
      current_stage: idea.current_stage,
    });
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!selectedIdea) return;
    setLoading(true);

    const { error } = await supabase
      .from('ideas')
      .update({
        ...formData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedIdea.id);

    setLoading(false);

    if (!error) {
      refreshIdeas();
      setIsEditing(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!selectedIdea) return;
    setLoading(true);

    const stageIndex = workflowStages.findIndex(s => s.id === selectedIdea.current_stage);
    const nextStage = workflowStages[Math.min(stageIndex + 1, workflowStages.length - 1)];

    const { error } = await supabase
      .from('ideas')
      .update({
        current_stage: nextStage.id,
        status: nextStage.id === 'final_approval' ? 'final_approval' : selectedIdea.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedIdea.id);

    setLoading(false);

    if (!error) {
      refreshIdeas();
      setSelectedIdea(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedIdea || !confirm('Are you sure you want to delete this idea?')) return;

    const { error } = await supabase
      .from('ideas')
      .delete()
      .eq('id', selectedIdea.id);

    if (!error) {
      refreshIdeas();
      setSelectedIdea(null);
    }
  };

  const getStageStatus = (stageId: string) => {
    if (!selectedIdea) return 'pending';
    const currentIndex = workflowStages.findIndex(s => s.id === selectedIdea.current_stage);
    const stageIndex = workflowStages.findIndex(s => s.id === stageId);
    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'current';
    return 'pending';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      submitted: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      d0_validation: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      d1_scoring: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      d2_d4_workflow: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      final_approval: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      approved: 'bg-green-500/20 text-green-400 border-green-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
      completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    };
    return colors[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Ideas List */}
      <div className="lg:col-span-1 space-y-4">
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search ideas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="d0_validation">D0 Validation</option>
            <option value="d1_scoring">D1 Scoring</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Ideas List */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-700/50">
            <h3 className="text-lg font-semibold text-white">Ideas ({filteredIdeas.length})</h3>
          </div>
          <div className="max-h-[calc(100vh-24rem)] overflow-y-auto">
            {filteredIdeas.length > 0 ? (
              filteredIdeas.map((idea) => (
                <button
                  key={idea.id}
                  onClick={() => handleSelectIdea(idea)}
                  className={`w-full p-4 text-left border-b border-slate-700/30 transition-all hover:bg-slate-700/30 ${
                    selectedIdea?.id === idea.id ? 'bg-slate-700/50 border-l-2 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-blue-400">{idea.project_id}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full border ${getStatusColor(idea.status)}`}>
                      {idea.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 className="text-white font-medium truncate">{idea.project_name}</h4>
                  <p className="text-sm text-slate-400 truncate mt-1">{idea.description || 'No description'}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-500">
                      {new Date(idea.created_at).toLocaleDateString()}
                    </span>
                    {idea.estimated_impact && (
                      <span className={`text-xs ${
                        idea.estimated_impact === 'high' ? 'text-green-400' :
                        idea.estimated_impact === 'medium' ? 'text-yellow-400' : 'text-slate-400'
                      }`}>
                        {idea.estimated_impact} impact
                      </span>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400">
                No ideas found. Submit your first idea!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Idea Details */}
      <div className="lg:col-span-2">
        {selectedIdea ? (
          <div className="space-y-6">
            {/* Workflow Stages */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Workflow Progress</h3>
              <div className="flex items-center justify-between mb-6">
                {workflowStages.map((stage, index) => (
                  <div key={stage.id} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          getStageStatus(stage.id) === 'completed'
                            ? 'bg-green-500 text-white'
                            : getStageStatus(stage.id) === 'current'
                            ? 'bg-blue-500 text-white animate-pulse'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        <stage.icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs text-slate-400 mt-2 text-center hidden sm:block">{stage.label}</span>
                    </div>
                    {index < workflowStages.length - 1 && (
                      <div className={`w-12 sm:w-20 h-1 mx-2 rounded ${
                        getStageStatus(stage.id) === 'completed' ? 'bg-green-500' : 'bg-slate-700'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Idea Form */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Project Details</h3>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Save'}
                      </button>
                    </>
                  ) : (
                    profile?.role !== 'employee' && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Project ID</label>
                  <input
                    type="text"
                    value={selectedIdea.project_id}
                    disabled
                    className="w-full px-4 py-2.5 bg-slate-700/30 border border-slate-600 rounded-lg text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Project Name</label>
                  <input
                    type="text"
                    value={formData.project_name}
                    onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2.5 border rounded-lg ${
                      isEditing
                        ? 'bg-slate-700/50 border-slate-600 text-white focus:outline-none focus:border-blue-500'
                        : 'bg-slate-700/30 border-slate-700 text-slate-300'
                    }`}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={!isEditing}
                    rows={3}
                    className={`w-full px-4 py-2.5 border rounded-lg resize-none ${
                      isEditing
                        ? 'bg-slate-700/50 border-slate-600 text-white focus:outline-none focus:border-blue-500'
                        : 'bg-slate-700/30 border-slate-700 text-slate-300'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Input Section */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Assessment Parameters</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">D0 Lever</label>
                  <select
                    value={formData.d0_lever}
                    onChange={(e) => setFormData({ ...formData, d0_lever: e.target.value })}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2.5 border rounded-lg ${
                      isEditing
                        ? 'bg-slate-700/50 border-slate-600 text-white focus:outline-none focus:border-blue-500'
                        : 'bg-slate-700/30 border-slate-700 text-slate-300'
                    }`}
                  >
                    <option value="">Select lever...</option>
                    <option value="cost_reduction">Cost Reduction</option>
                    <option value="revenue_growth">Revenue Growth</option>
                    <option value="efficiency">Efficiency Improvement</option>
                    <option value="quality">Quality Enhancement</option>
                    <option value="innovation">Innovation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Estimated Impact</label>
                  <div className="flex gap-2">
                    {['low', 'medium', 'high'].map((impact) => (
                      <button
                        key={impact}
                        type="button"
                        onClick={() => isEditing && setFormData({ ...formData, estimated_impact: impact as 'low' | 'medium' | 'high' })}
                        disabled={!isEditing}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                          formData.estimated_impact === impact
                            ? impact === 'high'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                              : impact === 'medium'
                              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                              : 'bg-slate-500/20 text-slate-400 border border-slate-500/50'
                            : 'bg-slate-700/30 text-slate-400 border border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        {impact}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Implementability</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'quick_win', label: 'Quick Win' },
                      { value: 'mid_effort', label: 'Mid Effort' },
                      { value: 'high_effort', label: 'High Effort' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => isEditing && setFormData({ ...formData, implementability: option.value as 'high_effort' | 'mid_effort' | 'quick_win' })}
                        disabled={!isEditing}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                          formData.implementability === option.value
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                            : 'bg-slate-700/30 text-slate-400 border border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.score}
                    onChange={(e) => setFormData({ ...formData, score: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSave}
                disabled={loading || !isEditing}
                className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Progress
              </button>
              <button
                onClick={handleSubmitForApproval}
                disabled={loading || profile?.role === 'employee'}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 transition-all"
              >
                <Send className="w-4 h-4" />
                Submit For Approval
              </button>
              <button
                onClick={() => {}}
                className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <FileDown className="w-4 h-4" />
                Export Excel
              </button>
              <button
                onClick={() => {}}
                className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Download PDF
              </button>
              {profile?.role === 'admin' && (
                <button
                  onClick={handleDelete}
                  className="px-6 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-12 text-center">
            <div className="w-20 h-20 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Select an Idea</h3>
            <p className="text-slate-400">Choose an idea from the list to view details and manage workflow stages.</p>
          </div>
        )}
      </div>
    </div>
  );
}
