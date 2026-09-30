import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import HiveDetails from './pages/HiveDetails';
import AiHealthAnalysis from './pages/AiHealthAnalysis';
import HoneyBatches from './pages/HoneyBatches';
import BatchDetails from './pages/BatchDetails';
import ConsumerVerification from './pages/ConsumerVerification';
import { AuthProvider } from './context/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  // Consumer verification page is standalone for consumer mobile QR scans
  const isVerifyPage = location.pathname.startsWith('/verify/');

  if (isVerifyPage) {
    return <main>{children}</main>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <span>🐝</span>
            <span className="font-bold">SmartBee</span>
            <span>– Smart Beekeeping & Honey Traceability System</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            SIH Prototype • Node.js + Express + PostgreSQL + React + Vite + Ollama + Open-Meteo
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/hives/:id" element={<HiveDetails />} />
            <Route path="/ai-health" element={<AiHealthAnalysis />} />
            <Route path="/batches" element={<HoneyBatches />} />
            <Route path="/batches/:batchCode" element={<BatchDetails />} />
            <Route path="/verify/:batchCode" element={<ConsumerVerification />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}
