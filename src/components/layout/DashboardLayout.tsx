import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { supabase } from '../../lib/supabase';
import { Idea } from '../../lib/supabase';

interface NewIdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

function NewIdeaModal({ isOpen, onClose, onSubmit }: NewIdeaModalProps) {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const projectId = `PRJ-${Date.now().toString(36).toUpperCase()}`;

    const { error: insertError } = await supabase.from('ideas').insert({
      project_id: projectId,
      project_name: projectName,
      description,
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setProjectName('');
    setDescription('');
    onSubmit();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md shadow-xl">
        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Submit New Idea</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Project Name</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Enter project name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
              placeholder="Describe your idea..."
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [newIdeaModalOpen, setNewIdeaModalOpen] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const location = useLocation();

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    const { data } = await supabase
      .from('ideas')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setIdeas(data);
  };

  const handleNewIdea = () => {
    setNewIdeaModalOpen(true);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const pageTitle = (() => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    const parts = path.split('/');
    const last = parts[parts.length - 1];
    return last.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  })();

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            onMenuClick={() => setSidebarOpen(true)}
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
            onNewIdea={handleNewIdea}
          />

          <main className="flex-1 overflow-y-auto bg-slate-950 p-4 lg:p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">{pageTitle}</h2>
              <p className="text-slate-400 mt-1">Monitor your workflow metrics and manage ideas</p>
            </div>
            <Outlet context={{ ideas, refreshIdeas: fetchIdeas }} />
          </main>
        </div>
      </div>

      <NewIdeaModal
        isOpen={newIdeaModalOpen}
        onClose={() => setNewIdeaModalOpen(false)}
        onSubmit={fetchIdeas}
      />
    </div>
  );
}
