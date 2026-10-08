import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getComparison } from '../utils/api';
import { ArrowLeft, AlertTriangle, CheckCircle, Shield, Copy, Check } from 'lucide-react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import js from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python';
import java from 'react-syntax-highlighter/dist/esm/languages/hljs/java';
import cpp from 'react-syntax-highlighter/dist/esm/languages/hljs/cpp';

SyntaxHighlighter.registerLanguage('javascript', js);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('java', java);
SyntaxHighlighter.registerLanguage('cpp', cpp);

const LANG_MAP = { javascript: 'javascript', typescript: 'javascript', python: 'python', java: 'java', 'c/c++': 'cpp', 'c++': 'cpp', c: 'cpp' };

function CodePanel({ file, matchedLineNumbers = [] }) {
  const [copied, setCopied] = useState(false);
  if (!file) return null;
  const lang = LANG_MAP[file.language] || 'javascript';
  const lines = file.code.split('\n');

  const copy = () => {
    navigator.clipboard.writeText(file.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-brand-400 flex-shrink-0" />
          <span className="text-sm font-medium text-slate-200 truncate">{file.name}</span>
          <span className="badge-blue text-xs flex-shrink-0">{file.language || 'code'}</span>
        </div>
        <button onClick={copy} className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0 ml-2">
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
        </button>
      </div>
      <div className="overflow-auto flex-1 code-panel" style={{ maxHeight: '70vh' }}>
        <div style={{ position: 'relative' }}>
          {lines.map((line, idx) => {
            const lineNum = idx + 1;
            const isMatched = matchedLineNumbers.includes(lineNum);
            return (
              <div key={idx} style={{
                display: 'flex',
                background: isMatched ? 'rgba(239,68,68,0.12)' : 'transparent',
                borderLeft: isMatched ? '2px solid #ef4444' : '2px solid transparent'
              }}>
                <span style={{ width: 36, minWidth: 36, textAlign: 'right', paddingRight: 12, color: isMatched ? '#ef4444' : '#475569', fontSize: 12, fontFamily: 'JetBrains Mono', lineHeight: '1.6', paddingTop: 1 }}>
                  {lineNum}
                </span>
                <SyntaxHighlighter
                  language={lang}
                  style={atomOneDark}
                  customStyle={{ background: 'transparent', margin: 0, padding: '0 12px', flex: 1, fontSize: 12.5, lineHeight: 1.6 }}
                  useInlineStyles
                  PreTag={({ children, ...props }) => <pre {...props} style={{ margin: 0, background: 'transparent' }}>{children}</pre>}
                >
                  {line || ' '}
                </SyntaxHighlighter>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ComparePage() {
  const { checkId, fileAId, fileBId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getComparison(checkId, fileAId, fileBId).then(({ data }) => { setData(data); setLoading(false); });
  }, [checkId, fileAId, fileBId]);

  if (loading) return (
    <div className="p-8 space-y-4 fade-in">
      <div className="h-10 shimmer rounded-lg w-1/3" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-96 shimmer rounded-xl" />
        <div className="h-96 shimmer rounded-xl" />
      </div>
    </div>
  );

  if (!data) return <div className="p-8 text-slate-400">Comparison not found.</div>;

  const simPct = Math.round(data.similarity * 100);
  const matched = data.details?.matchedLineNumbers || [];
  const fp = data.details?.fingerprints || {};
  const riskColor = simPct >= 70 ? 'red' : simPct >= 40 ? 'yellow' : 'green';
  const riskLabel = simPct >= 70 ? 'High Risk' : simPct >= 40 ? 'Medium Risk' : 'Low Risk';
  const riskBadge = simPct >= 70 ? 'badge-red' : simPct >= 40 ? 'badge-yellow' : 'badge-green';
  const barColor = simPct >= 70 ? '#ef4444' : simPct >= 40 ? '#eab308' : '#10b981';

  return (
    <div className="p-6 fade-in flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(`/check/${checkId}`)} className="text-slate-500 hover:text-slate-300 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-xl font-bold text-white">Side-by-Side Comparison</h1>
          <p className="text-slate-500 text-sm">{data.fileA?.name} vs {data.fileB?.name}</p>
        </div>
        <span className={`${riskBadge} text-sm px-3 py-1`}>{riskLabel}</span>
      </div>

      {/* Similarity metrics bar */}
      <div className="card p-5 grid grid-cols-4 gap-6">
        <div>
          <p className="text-xs text-slate-500 mb-1">Similarity Score</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-slate-700 rounded-full">
              <div className="h-full rounded-full" style={{ width: `${simPct}%`, background: barColor }} />
            </div>
            <span className="text-lg font-bold font-mono" style={{ color: barColor }}>{simPct}%</span>
          </div>
        </div>
        <div>
          <p className="text-xs text-slate-500">Matched Lines</p>
          <p className="text-xl font-bold text-slate-200">{matched.length}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Common Fingerprints</p>
          <p className="text-xl font-bold text-slate-200">{fp.common || 0}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Risk Level</p>
          <p className="text-xl font-bold" style={{ color: barColor }}>{riskLabel}</p>
        </div>
      </div>

      {/* Legend */}
      {matched.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="w-3 h-3 rounded-sm bg-red-500/20 border-l-2 border-red-500" />
          <span>Highlighted lines are suspected matches ({matched.length} lines flagged)</span>
        </div>
      )}

      {/* Side-by-side code */}
      <div className="grid grid-cols-2 gap-4" style={{ minHeight: 0 }}>
        <CodePanel file={data.fileA} matchedLineNumbers={matched} />
        <CodePanel file={data.fileB} matchedLineNumbers={matched} />
      </div>
    </div>
  );
}
