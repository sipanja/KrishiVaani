import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { FollowUpTask, NotificationRecord } from '../types';
import { EmptyState } from '../components/EmptyState';
import { 
  ClockAlert, 
  CheckCircle2, 
  XCircle, 
  Bell, 
  Send, 
  Check, 
  MessageSquare, 
  AlertCircle,
  HelpCircle,
  Calendar
} from 'lucide-react';

export const FollowUpsPage: React.FC = () => {
  const { language, t } = useAuth();
  const [tasks, setTasks] = useState<FollowUpTask[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Response Form
  const [selectedTask, setSelectedTask] = useState<FollowUpTask | null>(null);
  const [outcome, setOutcome] = useState<'improving' | 'same' | 'worsened' | 'resolved'>('improving');
  const [notes, setNotes] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [fRes, nRes] = await Promise.all([
        api.getFollowUps(),
        api.getNotifications()
      ]);
      setTasks(fRes.follow_ups);
      setNotifications(nRes.notifications);
    } catch (err) {
      console.error('Failed to load followups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRespond = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    setSubmitting(true);
    try {
      await api.respondToFollowUp(selectedTask.id, outcome, notes, actionTaken);
      setSelectedTask(null);
      setNotes('');
      setActionTaken('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelTask = async (id: number) => {
    if (!confirm('Cancel this follow-up reminder?')) return;
    try {
      await api.cancelFollowUp(id);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleMarkNotificationRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      loadData();
    } catch (err: any) {
      console.error(err);
    }
  };

  const pendingTasks = tasks.filter((t) => ['pending', 'in_progress'].includes(t.status));
  const completedTasks = tasks.filter((t) => ['completed', 'cancelled'].includes(t.status));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">{t.nav_followups}</h1>
        <p className="text-xs text-gray-500 mt-1">
          {language === 'hi'
            ? 'फसल सुधार की जांच के लिए स्वचालित अनुवर्ती प्रश्न। उत्तर देने पर आपकी फसल की स्थिति अपडेट होती है।'
            : 'Scheduled observation check-ins. Your feedback updates the persistent crop issue status.'}
        </p>
      </div>

      {/* Due Follow-up Tasks */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
          <ClockAlert className="w-5 h-5 text-amber-600" />
          <span>{language === 'hi' ? 'उत्तर देने योग्य फॉलो-अप' : 'Pending Action Follow-ups'} ({pendingTasks.length})</span>
        </h2>

        {pendingTasks.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title={t.empty_followups_title}
            description={t.empty_followups_desc}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingTasks.map((task) => (
              <div
                key={task.id}
                className="p-5 rounded-3xl bg-amber-50/70 border border-amber-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                      {task.issue_title || 'Crop Follow-up'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 capitalize">
                      {task.status}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-gray-900 mt-2 leading-relaxed">
                    "{task.prompt_question}"
                  </p>

                  <p className="text-xs text-amber-900/80 mt-1">
                    Reason: {task.reason}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-amber-200 flex items-center justify-between gap-3">
                  <button
                    onClick={() => handleCancelTask(task.id)}
                    className="text-xs text-gray-500 hover:text-red-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTask(task);
                      setOutcome('improving');
                    }}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                  >
                    {language === 'hi' ? 'उत्तर दर्ज करें' : 'Respond to Check-in'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Response Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-krishi-100 relative">
            <h3 className="text-base font-bold text-gray-900 mb-1">{t.followup_question}</h3>
            <p className="text-xs text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200 mb-4 font-medium">
              "{selectedTask.prompt_question}"
            </p>

            <form onSubmit={handleRespond} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{t.how_is_crop}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOutcome('improving')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                      outcome === 'improving' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-gray-50 border-gray-300 text-gray-700'
                    }`}
                  >
                    🌱 {t.improved}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutcome('same')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                      outcome === 'same' ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-gray-50 border-gray-300 text-gray-700'
                    }`}
                  >
                    ⚖️ {t.unchanged}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutcome('worsened')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                      outcome === 'worsened' ? 'bg-red-600 text-white border-red-600 shadow-sm' : 'bg-gray-50 border-gray-300 text-gray-700'
                    }`}
                  >
                    ⚠️ {t.worsened}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutcome('resolved')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                      outcome === 'resolved' ? 'bg-green-600 text-white border-green-600 shadow-sm' : 'bg-gray-50 border-gray-300 text-gray-700'
                    }`}
                  >
                    ✅ {t.status_resolved}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{t.actions_taken}</label>
                <input
                  type="text"
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder="e.g. Applied recommended biocontrol, cleared field drains"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-krishi-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{language === 'hi' ? 'अतिरिक्त टिप्पणी' : 'Additional Notes'}</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observations..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-krishi-700 hover:bg-krishi-800 text-white font-bold text-xs rounded-xl shadow"
                >
                  {submitting ? 'Submitting...' : t.submit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Notifications History */}
      <section className="space-y-4 pt-4 border-t border-gray-200">
        <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
          <Bell className="w-5 h-5 text-krishi-700" />
          <span>{t.notifications} ({notifications.length})</span>
        </h2>

        {notifications.length === 0 ? (
          <p className="text-xs text-gray-500 italic">No notification alerts recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between ${
                  notif.read_at ? 'bg-white border-gray-200 text-gray-700' : 'bg-krishi-50/70 border-krishi-300 text-gray-900 font-medium'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-gray-900">{notif.title}</span>
                    <span className="text-[10px] uppercase font-bold text-krishi-800 bg-white px-2 py-0.5 rounded border border-krishi-200">
                      {notif.channel}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Delivered: {new Date(notif.created_at).toLocaleString()}
                  </p>
                </div>

                {!notif.read_at && (
                  <button
                    onClick={() => handleMarkNotificationRead(notif.id)}
                    className="px-2.5 py-1 text-[11px] font-semibold text-krishi-700 hover:text-krishi-900 bg-white rounded-lg border border-krishi-200"
                  >
                    {t.mark_all_read}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Completed Follow-ups history */}
      {completedTasks.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-gray-200">
          <h2 className="text-sm font-bold text-gray-700">Completed Follow-Up History ({completedTasks.length})</h2>
          <div className="space-y-2">
            {completedTasks.map((tItem) => (
              <div key={tItem.id} className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800">{tItem.issue_title || tItem.reason}</span>
                  <span className="text-[10px] uppercase font-bold text-gray-500">{tItem.status}</span>
                </div>
                <p className="text-gray-600 mt-0.5">{tItem.result_notes || tItem.prompt_question}</p>
                <p className="text-[10px] text-gray-400 mt-1">
                  Completed: {new Date(tItem.completed_at || tItem.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
};
