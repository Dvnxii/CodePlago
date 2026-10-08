import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Shield, Home, FolderOpen, Plus, ChevronLeft, ChevronRight, Github, Zap } from 'lucide-react';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex h-screen overflow-hidden bg-surface-950">
      {/* Sidebar */}
      <aside className={`flex flex-col bg-surface-900 border-r border-slate-800 transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'} flex-shrink-0`}>
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-800 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center flex-shrink-0">
            <Shield size={16} className="text-white" />
          </div>
          {!collapsed && <span className="font-display font-700 text-white text-lg">CodePlago</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          <NavLink to="/" end className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-brand-500/20 text-brand-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'} ${collapsed ? 'justify-center' : ''}`
          }>
            <Home size={18} />
            {!collapsed && 'Dashboard'}
          </NavLink>

          <NavLink to="/new" className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-brand-500/20 text-brand-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'} ${collapsed ? 'justify-center' : ''}`
          }>
            <Plus size={18} />
            {!collapsed && 'New Check'}
          </NavLink>

          <NavLink to="/" className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-slate-400 hover:text-slate-200 hover:bg-slate-800 ${collapsed ? 'justify-center' : ''}`
          }>
            <FolderOpen size={18} />
            {!collapsed && 'All Checks'}
          </NavLink>
        </nav>

        {/* Footer */}
        <div className={`p-3 border-t border-slate-800 ${collapsed ? 'flex justify-center' : ''}`}>
          {!collapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Zap size={12} className="text-brand-400" />
                <span>v1.0.0</span>
              </div>
              <button onClick={() => setCollapsed(true)} className="text-slate-500 hover:text-slate-300 transition-colors">
                <ChevronLeft size={16} />
              </button>
            </div>
          ) : (
            <button onClick={() => setCollapsed(false)} className="text-slate-500 hover:text-slate-300 transition-colors">
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
