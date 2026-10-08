import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { createCheck } from '../utils/api';
import { Upload, X, FileCode, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const LANG_COLORS = {
  javascript: '#f7df1e', typescript: '#3178c6', python: '#3776ab',
  java: '#b07219', 'c/c++': '#555555', 'c#': '#239120',
  go: '#00add8', ruby: '#cc342d', php: '#777bb4', rust: '#ce412b',
  swift: '#f05138', kotlin: '#7f52ff', unknown: '#64748b'
};

function getExt(name) {
  return name.split('.').pop().toLowerCase();
}

export default function NewCheckPage() {
  const [files, setFiles] = useState([]);
  const [checkName, setCheckName] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onDrop = useCallback(accepted => {
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name));
      return [...prev, ...accepted.filter(f => !names.has(f.name))];
    });
    setError('');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/plain': [], 'application/octet-stream': [] },
    multiple: true
  });

  const removeFile = (name) => setFiles(files.filter(f => f.name !== name));

  const handleSubmit = async () => {
    if (files.length < 2) {
      setError('Please upload at least 2 files to compare.');
      return;
    }
    setLoading(true);
    setError('');
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    formData.append('checkName', checkName || `Check - ${new Date().toLocaleDateString()}`);
    try {
      const { data } = await createCheck(formData, e => {
        if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
      });
      navigate(`/check/${data.checkId}`);
    } catch (e) {
      setError(e.response?.data?.error || 'Upload failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto fade-in">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white">New Plagiarism Check</h1>
        <p className="text-slate-400 mt-1">Upload 2 or more code files to compare</p>
      </div>

      {/* Check name */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-slate-300 mb-2">Check Name (optional)</label>
        <input
          type="text"
          value={checkName}
          onChange={e => setCheckName(e.target.value)}
          placeholder="e.g. CS101 Assignment 3"
          className="w-full bg-surface-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
        />
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
          isDragActive ? 'drop-zone-active border-brand-500 bg-brand-500/8' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/30'
        }`}
      >
        <input {...getInputProps()} />
        <Upload size={36} className={`mx-auto mb-3 ${isDragActive ? 'text-brand-400' : 'text-slate-500'}`} />
        <p className="text-slate-300 font-medium">
          {isDragActive ? 'Drop files here...' : 'Drag & drop code files here'}
        </p>
        <p className="text-slate-500 text-sm mt-1">or click to browse · All code file types supported</p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-5 card divide-y divide-slate-700/30">
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-300">{files.length} file{files.length !== 1 ? 's' : ''} selected</span>
            <button onClick={() => setFiles([])} className="text-xs text-slate-500 hover:text-slate-300">Clear all</button>
          </div>
          {files.map(file => (
            <div key={file.name} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded bg-slate-700 flex items-center justify-center text-xs font-mono font-bold"
                  style={{ color: LANG_COLORS[getExt(file.name)] || '#94a3b8' }}>
                  {getExt(file.name).slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-slate-200 font-medium">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button onClick={() => removeFile(file.name)} className="text-slate-600 hover:text-red-400 transition-colors">
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          <AlertCircle size={16} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading || files.length < 2}
        className="mt-6 w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-base"
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Analyzing... {progress > 0 && `${progress}%`}
          </>
        ) : (
          <>
            <CheckCircle size={18} />
            Start Plagiarism Check
          </>
        )}
      </button>

      {files.length < 2 && files.length > 0 && (
        <p className="text-center text-slate-500 text-sm mt-3">Add at least one more file to run the check</p>
      )}
    </div>
  );
}
