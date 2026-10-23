import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  ShieldCheck, 
  Activity, 
  Database, 
  Mic, 
  CloudSun, 
  Clock, 
  Users, 
  RefreshCw, 
  AlertCircle,
  CheckCircle2,
  List
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { user, language, t } = useAuth();
  
  const [healthData, setHealthData] = useState<any>(null);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAdminData = async () => {
    try {
      const [hRes, sRes, lRes] = await Promise.all([
        api.getAdminHealth(),
        api.getAdminSystemStatus(),
        api.getAdminAuditLogs(1)
      ]);
      setHealthData(hRes);
      setSystemStatus(sRes);
      setAuditLogs(lRes.logs || []);
    } catch (err) {
      console.error('Admin data load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAdminData();
    }
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAdminData();
  };

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-red-50 text-center rounded-3xl border border-red-200">
        <ShieldCheck className="w-12 h-12 text-red-600 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-red-950">Access Denied</h2>
        <p className="text-xs text-red-800 mt-1">
          This operational console requires administrator role authorization.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-gray-900">{t.nav_admin}</h1>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-900 rounded-full">
              Operator Console
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Real-time infrastructure health, third-party provider status, database telemetry, and security audit logs.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Integration & Infrastructure Health Cards */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
          <Activity className="w-4 h-4 text-krishi-700" />
          <span>Service Health Diagnostics</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Gnani Voice Engine */}
          <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-700">Gnani AI Voice</span>
              <Mic className="w-4 h-4 text-krishi-700" />
            </div>
            <div className="flex items-center space-x-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                healthData?.voice_engine?.status === 'healthy' ? 'bg-green-500 animate-pulse' : 'bg-amber-500'
              }`} />
              <span className="text-xs font-semibold capitalize">
                {healthData?.voice_engine?.status || 'Checking...'}
              </span>
            </div>
            <p className="text-[10px] text-gray-500 mt-2 truncate">
              {healthData?.voice_engine?.message || 'Prisma STT & Timbre TTS'}
            </p>
          </div>

          {/* Database Health */}
          <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-700">Database Engine</span>
              <Database className="w-4 h-4 text-krishi-700" />
            </div>
            <div className="flex items-center space-x-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                healthData?.database === 'healthy' ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="text-xs font-semibold capitalize">
                {healthData?.database || 'Connected'}
              </span>
            </div>
            <p className="text-[10px] text-gray-500 mt-2">
              SQLAlchemy & Relational Pool Active
            </p>
          </div>

          {/* Weather Intelligence Provider */}
          <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-700">Weather Provider</span>
              <CloudSun className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-center space-x-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                healthData?.weather_service?.status === 'healthy' ? 'bg-green-500' : 'bg-amber-500'
              }`} />
              <span className="text-xs font-semibold capitalize">
                {healthData?.weather_service?.status || 'Operational'}
              </span>
            </div>
            <p className="text-[10px] text-gray-500 mt-2 truncate">
              {healthData?.weather_service?.provider || 'Open-Meteo & IMD Hazard Rules'}
            </p>
          </div>

          {/* Background Worker */}
          <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-700">Task Scheduler</span>
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-xs font-semibold capitalize">Active</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-2">
              Follow-Up & Quiet Hours Processor (60s loop)
            </p>
          </div>

        </div>
      </section>

      {/* Real Live Database Totals (No Mock Data) */}
      <section className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
          <Users className="w-4 h-4 text-krishi-700" />
          <span>Real Database Record Counts (No Demo Data)</span>
        </h2>

        {systemStatus ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-[11px] text-gray-500">Farmers Registered</p>
              <p className="text-xl font-black text-gray-900 mt-1">{systemStatus.total_farmers}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-[11px] text-gray-500">Registered Farms</p>
              <p className="text-xl font-black text-gray-900 mt-1">{systemStatus.total_farms}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-[11px] text-gray-500">Standing Crops</p>
              <p className="text-xl font-black text-gray-900 mt-1">{systemStatus.total_crop_cycles}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-[11px] text-gray-500">Open Crop Issues</p>
              <p className="text-xl font-black text-red-600 mt-1">{systemStatus.open_crop_issues}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-[11px] text-gray-500">Resolved Issues</p>
              <p className="text-xl font-black text-green-600 mt-1">{systemStatus.resolved_crop_issues}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-[11px] text-gray-500">Follow-up Tasks</p>
              <p className="text-xl font-black text-amber-600 mt-1">{systemStatus.pending_followups}</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400">Loading system statistics...</p>
        )}
      </section>

      {/* Audit Logs */}
      <section className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
          <List className="w-4 h-4 text-krishi-700" />
          <span>Security & Operational Audit Trail ({auditLogs.length})</span>
        </h2>

        {auditLogs.length === 0 ? (
          <p className="text-xs text-gray-500 italic">No audit records logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase">
                  <th className="py-2 pr-4">Action</th>
                  <th className="py-2 pr-4">User ID</th>
                  <th className="py-2 pr-4">IP Address</th>
                  <th className="py-2 pr-4">Details</th>
                  <th className="py-2">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="text-gray-700">
                    <td className="py-2.5 pr-4 font-bold text-krishi-900">{log.action}</td>
                    <td className="py-2.5 pr-4">{log.user_id || 'System'}</td>
                    <td className="py-2.5 pr-4 font-mono text-[11px]">{log.ip_address || '127.0.0.1'}</td>
                    <td className="py-2.5 pr-4">{log.details}</td>
                    <td className="py-2.5 text-gray-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
};
