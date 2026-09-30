import React, { useEffect, useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Database,
  Radio,
  User,
  LogIn,
  UserPlus,
  LogOut
} from 'lucide-react';
import { getSystemStatus } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [quickVerifyCode, setQuickVerifyCode] = useState('');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [backendOffline, setBackendOffline] = useState(false);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  async function checkStatus() {
    try {
      const status = await getSystemStatus();
      setSystemStatus(status);
      setBackendOffline(false);
    } catch {
      setBackendOffline(true);
      setSystemStatus({ backend: 'offline', database: 'disconnected', ollama: 'unavailable' });
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function handleQuickVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!quickVerifyCode.trim()) return;
    navigate(`/verify/${encodeURIComponent(quickVerifyCode.trim())}`);
    setShowVerifyModal(false);
    setQuickVerifyCode('');
  }

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: Activity },
    { to: '/ai-health', label: 'AI Health', icon: Cpu },
    { to: '/batches', label: 'Honey Batches', icon: ShieldCheck },
  ];

  return (
    <>
      {backendOffline && (
        <div className="bg-rose-600 text-white text-xs px-4 py-2 text-center font-medium shadow-sm flex items-center justify-center gap-2">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>Backend API is unavailable. Please start the SmartBee backend on port 5000.</span>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 text-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-xs group-hover:bg-emerald-700 transition-colors">
                  🐝
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-slate-900 tracking-tight">
                      SmartBee
                    </span>
                    <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                      SIH Prototype
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 hidden sm:block leading-none">
                    Smart Beekeeping & Honey Traceability
                  </p>
                </div>
              </Link>

              {/* Navigation Links */}
              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Right Status Badges & Quick Verify */}
            <div className="flex items-center gap-2.5">
              {/* System Status Indicators */}
              <div className="hidden lg:flex items-center gap-2 text-[11px]">
                {/* Database badge */}
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-medium border ${
                    systemStatus?.database === 'connected'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                  title={systemStatus?.database === 'connected' ? 'PostgreSQL Connected' : 'PostgreSQL Disconnected (In-Memory Active)'}
                >
                  <Database className="w-3 h-3" />
                  <span>DB: {systemStatus?.database || 'checking'}</span>
                </span>

                {/* Ollama badge */}
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-medium border ${
                    systemStatus?.ollama === 'available'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                  title={systemStatus?.ollama === 'available' ? 'Local Ollama LLM Ready' : 'Ollama Unavailable (Start with: ollama run llama3)'}
                >
                  <Cpu className="w-3 h-3" />
                  <span>AI: {systemStatus?.ollama || 'checking'}</span>
                </span>
              </div>

              {/* Verify Batch Quick Trigger */}
              <button
                onClick={() => setShowVerifyModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Verify Batch</span>
              </button>

              {/* Authentication Controls */}
              <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200">
                {isAuthenticated && user ? (
                  <div className="flex items-center gap-1.5">
                    <div 
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs font-medium"
                      title={user.email}
                    >
                      <User className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="max-w-[100px] truncate">{user.name}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Log out of account"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Logout</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Link
                      to="/login"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Login</span>
                    </Link>
                    <Link
                      to="/register"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-xs transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Register</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden border-t border-slate-200 px-4 py-2 flex items-center justify-around bg-slate-50 text-xs">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-1 px-2.5 py-1.5 rounded-md font-medium ${
                  isActive ? 'bg-emerald-100 text-emerald-800' : 'text-slate-600'
                }`
              }
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </NavLink>
          ))}
          {/* Mobile Auth Link */}
          {isAuthenticated && user ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md font-medium text-rose-600"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `flex items-center gap-1 px-2.5 py-1.5 rounded-md font-medium ${
                  isActive ? 'bg-amber-100 text-amber-800' : 'text-amber-700 font-semibold'
                }`
              }
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </NavLink>
          )}
        </div>
      </header>

      {/* Quick Verify Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Verify Honey Batch</span>
              </h3>
              <button
                onClick={() => setShowVerifyModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Enter the unique honey batch code printed on the jar label to verify cryptographic SHA-256 integrity and apiary origin.
            </p>

            <form onSubmit={handleQuickVerify} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Batch Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BATCH-2026-001"
                  value={quickVerifyCode}
                  onChange={(e) => setQuickVerifyCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setQuickVerifyCode('BATCH-2026-001');
                  }}
                  className="text-xs text-emerald-600 hover:underline"
                >
                  Use sample BATCH-2026-001
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowVerifyModal(false)}
                    className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
                  >
                    Verify Authenticity
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
