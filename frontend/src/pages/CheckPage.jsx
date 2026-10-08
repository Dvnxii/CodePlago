import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCheck } from '../utils/api';
import { ArrowLeft, AlertTriangle, CheckCircle, Shield, Eye, FileCode, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const RISK_CONFIG = {
  red: { label: 'High Risk', cls: 'badge-red', bg: 'bg-red-500/10 border-red-500/20', icon: AlertTriangle, color: '#ef4444' },
  yellow: { label: 'Medium Risk', cls: 'badge-yellow', bg: 'bg-yellow-500/10 border-yellow-500/20', icon: Shield, color: '#eab308' },
  green: { label: 'Low Risk', cls: 'badge-green', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle, color: '#10b981' }
};

function SimilarityBar({ value }) {
  const pct = Math.round(value * 100);
  const color = pct >= 70 ? '#ef4444' : pct >= 40 ? '#eab308' : '#10b981';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-sm font-mono font-semibold w-10 text-right" style={{ color }}>{pct}%</span>
    </div>
  );
}

export default function CheckPage() {
  const { checkId } = useParams();
  const navigate = useNavigate();
  const [check, setCheck] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCheck(checkId).then(({ data }) => { setCheck(data); setLoading(false); });
  }, [checkId]);

  if (loading) return (
    <div className="p-8 space-y-4 fade-in">
      {[1,2,3,4].map(i => <div key={i} className="h-16 shimmer rounded-xl" />)}
    </div>
  );

  if (!check) return <div className="p-8 text-slate-400">Check not found.</div>;

  const { results, files, summary } = check;
  const pieData = [
    { name: 'High Risk', value: summary?.highRisk || 0, color: '#ef4444' },
    { name: 'Medium Risk', value: summary?.mediumRisk || 0, color: '#eab308' },
    { name: 'Low Risk', value: summary?.lowRisk || 0, color: '#10b981' }
  ].filter(d => d.value > 0);

  const sortedResults = [...(results || [])].sort((a, b) => b.similarity - a.similarity);
  const overallRisk = summary?.maxSimilarity >= 0.7 ? 'red' : summary?.maxSimilarity >= 0.4 ? 'yellow' : 'green';
  const rc = RISK_CONFIG[overallRisk];

  return (
    <div className="p-8 fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/')} className="text-slate-500 hover:text-slate-300 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold text-white">{check.name}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{new Date(check.created_at).toLocaleString()}</p>
        </div>
        <span className={rc.cls + ' text-sm px-3 py-1'}>{rc.label}</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Files Analyzed', value: files?.length || 0, color: 'text-brand-400' },
          { label: 'Comparisons', value: results?.length || 0, color: 'text-slate-300' },
          { label: 'High Risk Pairs', value: summary?.highRisk || 0, color: 'text-red-400' },
          { label: 'Max Similarity', value: `${Math.round((summary?.maxSimilarity || 0) * 100)}%`, color: summary?.maxSimilarity >= 0.7 ? 'text-red-400' : summary?.maxSimilarity >= 0.4 ? 'text-yellow-400' : 'text-emerald-400' }
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-5">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Results table */}
        <div className="col-span-2 card">
          <div className="px-5 py-4 border-b border-slate-700/50">
            <h2 className="font-semibold text-slate-200">Comparison Results</h2>
          </div>
          <div className="divide-y divide-slate-700/30">
            {sortedResults.length === 0 ? (
              <div className="p-12 text-center text-slate-500">No results available.</div>
            ) : sortedResults.map(result => {
              const risk = result.risk || { color: 'green' };
              const rConf = RISK_CONFIG[risk.color];
              return (
                <div key={result.id} className="px-5 py-4 hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileCode size={14} className="text-slate-500 flex-shrink-0" />
                      <span className="text-sm text-slate-300 truncate">{result.fileA?.name}</span>
                      <span className="text-slate-600 flex-shrink-0">vs</span>
                      <FileCode size={14} className="text-slate-500 flex-shrink-0" />
                      <span className="text-sm text-slate-300 truncate">{result.fileB?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                      <span className={rConf.cls}>{rConf.label}</span>
                      <button
                        onClick={() => navigate(`/check/${checkId}/compare/${result.fileA?.id}/${result.fileB?.id}`)}
                        className="btn-secondary py-1 px-2.5 text-xs flex items-center gap-1"
                      >
                        <Eye size={12} /> View
                      </button>
                    </div>
                  </div>
                  <SimilarityBar value={result.similarity} />
                  <p className="text-xs text-slate-600 mt-1">{result.matchedLines} matching lines</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar: files + chart */}
        <div className="space-y-4">
          {/* Pie chart */}
          {pieData.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Risk Distribution</h3>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v + ' pairs', n]} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                    <span>{d.name}</span>
                    <span className="ml-auto text-slate-300 font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files list */}
          <div className="card">
            <div className="px-4 py-3 border-b border-slate-700/50">
              <h3 className="text-sm font-semibold text-slate-300">Submitted Files</h3>
            </div>
            <div className="divide-y divide-slate-700/20">
              {(files || []).map(file => (
                <div key={file.id} className="px-4 py-3 flex items-center gap-3">
                  <FileCode size={14} className="text-slate-500" />
                  <div className="min-w-0">
                    <p className="text-sm text-slate-300 truncate">{file.name}</p>
                    <p className="text-xs text-slate-600">{file.language} · {file.lines} lines</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
