import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getChecks, deleteCheck } from '../utils/api';
import { Shield, Plus, Trash2, ChevronRight, AlertTriangle, CheckCircle, Clock, FileCode } from 'lucide-react';

export default function HomePage() {
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { fetchChecks(); }, []);

  const fetchChecks = async () => {
    try {
      const { data } = await getChecks();
      setChecks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this check?')) return;
    await deleteCheck(id);
    setChecks(checks.filter(c => c.id !== id));
  };

  return (
    <div className="p-8 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">Detect code plagiarism across your submissions</p>
        </div>
        <button onClick={() => navigate('/new')} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          New Check
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Checks', value: checks.length, icon: Shield, color: 'text-brand-400' },
          { label: 'Processing', value: checks.filter(c => c.status === 'processing').length, icon: Clock, color: 'text-yellow-400' },
          { label: 'Completed', value: checks.filter(c => c.status === 'complete').length, icon: CheckCircle, color: 'text-emerald-400' }
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center gap-3">
              <Icon size={20} className={color} />
              <div>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Checks list */}
      <div className="card">
        <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
          <h2 className="font-semibold text-slate-200">Recent Checks</h2>
          <span className="text-xs text-slate-500">{checks.length} total</span>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-14 shimmer rounded-lg" />)}
          </div>
        ) : checks.length === 0 ? (
          <div className="p-16 text-center">
            <FileCode size={40} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No checks yet</p>
            <p className="text-slate-600 text-sm mt-1">Upload code files to start detecting plagiarism</p>
            <button onClick={() => navigate('/new')} className="btn-primary mt-4 inline-flex items-center gap-2">
              <Plus size={15} /> Create your first check
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/30">
            {checks.map(check => (
              <div
                key={check.id}
                onClick={() => navigate(`/check/${check.id}`)}
                className="flex items-center justify-between px-5 py-4 hover:bg-slate-800/40 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-brand-500/15 flex items-center justify-center">
                    <Shield size={16} className="text-brand-400" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-200 group-hover:text-white transition-colors">{check.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {check.file_count} files · {new Date(check.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={check.status === 'complete' ? 'badge-green' : 'badge-yellow'}>
                    {check.status}
                  </span>
                  <button
                    onClick={e => handleDelete(e, check.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={15} />
                  </button>
                  <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
