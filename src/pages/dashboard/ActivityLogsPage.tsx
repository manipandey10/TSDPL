import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ActivityLog } from '../../lib/supabase';
import { Activity, Clock, User, FileText, Zap, AlertCircle } from 'lucide-react';

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (data) setLogs(data);
    setLoading(false);
  };

  const getActionIcon = (action: string) => {
    if (action.includes('create') || action.includes('submit')) return FileText;
    if (action.includes('update') || action.includes('edit')) return Zap;
    if (action.includes('delete')) return AlertCircle;
    return Activity;
  };

  const getActionColor = (action: string) => {
    if (action.includes('create')) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (action.includes('update')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (action.includes('delete')) return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  // Sample logs if none exist
  const sampleLogs: ActivityLog[] = logs.length > 0 ? logs : [
    {
      id: '1',
      user_id: 'sample',
      action: 'create_idea',
      entity_type: 'idea',
      entity_id: null,
      details: { project_name: 'Sample Project' },
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      user_id: 'sample',
      action: 'update_status',
      entity_type: 'idea',
      entity_id: null,
      details: { status: 'approved' },
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Activity Logs</h2>
          <p className="text-slate-400 mt-1">Track all system activities and changes</p>
        </div>
        <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
          Export Logs
        </button>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {sampleLogs.map((log) => {
              const Icon = getActionIcon(log.action);
              return (
                <div key={log.id} className="p-4 hover:bg-slate-700/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${getActionColor(log.action)}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-white font-medium capitalize">{log.action.replace(/_/g, ' ')}</p>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      {log.details && (
                        <p className="text-sm text-slate-400 mt-1">
                          {JSON.stringify(log.details).slice(0, 100)}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          User
                        </span>
                        {log.entity_type && (
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {log.entity_type}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
