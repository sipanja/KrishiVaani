import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CropIssue, CropCycle, IssueObservation } from '../types';
import { EmptyState } from '../components/EmptyState';
import { AudioPlayerButton } from '../components/AudioPlayerButton';
import { 
  Stethoscope, 
  Plus, 
  Upload, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  BookOpen, 
  Loader2, 
  X,
  ChevronRight,
  ShieldAlert,
  HelpCircle,
  Activity
} from 'lucide-react';

export const CropHealthPage: React.FC = () => {
  const { language, t } = useAuth();
  
  const [issues, setIssues] = useState<CropIssue[]>([]);
  const [crops, setCrops] = useState<CropCycle[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<CropIssue | null>(null);
  const [loading, setLoading] = useState(true);

  // New Issue Modal
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [cropId, setCropId] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [reporting, setReporting] = useState(false);

  // Observation Form inside Issue Details
  const [obsNotes, setObsNotes] = useState('');
  const [obsChange, setObsChange] = useState<'improving' | 'same' | 'worsened' | 'resolved'>('same');
  const [obsAction, setObsAction] = useState('');
  const [obsPhoto, setObsPhoto] = useState<File | null>(null);
  const [addingObs, setAddingObs] = useState(false);

  const loadData = async () => {
    try {
      const [issuesRes, cropsRes] = await Promise.all([
        api.getIssues(),
        api.getCrops()
      ]);
      setIssues(issuesRes.issues);
      setCrops(cropsRes.crops);
      if (cropsRes.crops.length > 0 && !cropId) {
        setCropId(cropsRes.crops[0].id);
      }
      if (issuesRes.issues.length > 0 && !selectedIssue) {
        // Select first issue by default
        loadIssueDetails(issuesRes.issues[0].id);
      }
    } catch (err) {
      console.error('Failed to load crop health issues:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadIssueDetails = async (id: number) => {
    try {
      const res = await api.getIssue(id);
      setSelectedIssue(res.issue);
    } catch (err) {
      console.error('Error loading issue details:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cropId || !symptoms) return;

    setReporting(true);
    try {
      const formData = new FormData();
      formData.append('crop_id', cropId.toString());
      formData.append('title', title || `${symptoms.slice(0, 30)}...`);
      formData.append('symptoms', symptoms);
      if (photoFile) {
        formData.append('image', photoFile);
      }

      const res = await api.reportIssue(formData);
      setReportModalOpen(false);
      setTitle('');
      setSymptoms('');
      setPhotoFile(null);
      setPhotoPreview(null);

      // Refresh and open the new issue
      await loadData();
      loadIssueDetails(res.issue.id);
    } catch (err: any) {
      alert(err.message || 'Failed to report crop issue');
    } finally {
      setReporting(false);
    }
  };

  const handleAddObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;

    setAddingObs(true);
    try {
      const formData = new FormData();
      formData.append('notes', obsNotes);
      formData.append('symptom_change', obsChange);
      formData.append('action_taken', obsAction);
      if (obsPhoto) {
        formData.append('image', obsPhoto);
      }

      await api.addObservation(selectedIssue.id, formData);
      setObsNotes('');
      setObsAction('');
      setObsPhoto(null);
      
      // Reload updated issue timeline
      loadIssueDetails(selectedIssue.id);
      // Reload list to update status tags
      const updatedList = await api.getIssues();
      setIssues(updatedList.issues);
    } catch (err: any) {
      alert(err.message || 'Failed to add observation');
    } finally {
      setAddingObs(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedIssue) return;
    try {
      await api.updateIssueStatus(selectedIssue.id, newStatus);
      loadIssueDetails(selectedIssue.id);
      const updatedList = await api.getIssues();
      setIssues(updatedList.issues);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">{t.nav_crop_health}</h1>
          <p className="text-xs text-gray-500 mt-1">
            {language === 'hi'
              ? 'फसल रोगों के लक्षण दर्ज करें, ICAR प्रमाणित निदान पाएं और समय के साथ सुधार ट्रैक करें।'
              : 'Log crop health issues, receive grounded ICAR advisory, and track symptom recovery.'}
          </p>
        </div>

        <button
          onClick={() => setReportModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-krishi-700 hover:bg-krishi-800 text-white font-semibold text-xs shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t.report_issue_btn}</span>
        </button>
      </div>

      {issues.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title={t.empty_issues_title}
          description={t.empty_issues_desc}
          actionLabel={crops.length > 0 ? t.report_issue_btn : undefined}
          onAction={crops.length > 0 ? () => setReportModalOpen(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Issues List */}
          <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-gray-900 mb-2">
              {language === 'hi' ? 'दर्ज समस्याएं' : 'Reported Crop Issues'} ({issues.length})
            </h2>

            <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-1">
              {issues.map((issue) => {
                const isSelected = selectedIssue?.id === issue.id;
                return (
                  <div
                    key={issue.id}
                    onClick={() => loadIssueDetails(issue.id)}
                    className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-krishi-50/80 border-krishi-400 shadow-sm'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900 truncate max-w-[180px]">
                        {issue.title}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        issue.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        issue.status === 'worsening' ? 'bg-red-100 text-red-800' :
                        issue.status === 'improving' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {issue.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-600 mt-1 line-clamp-1">
                      {issue.diagnosis_estimate || issue.reported_symptoms}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
                      <span>{issue.crop_name}</span>
                      <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column (2 Cols): Active Issue Timeline & Guidance */}
          <div className="lg:col-span-2 space-y-6">
            {selectedIssue ? (
              <>
                {/* Diagnostic Card */}
                <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
                  
                  {/* Status & Title Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-krishi-100 text-krishi-800">
                          {selectedIssue.crop_name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {selectedIssue.farm_name || 'Farm'}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 mt-1">{selectedIssue.title}</h2>
                    </div>

                    {/* Status Changer */}
                    <div className="flex items-center space-x-2">
                      <select
                        value={selectedIssue.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-300 bg-white text-gray-800 outline-none"
                      >
                        <option value="open">Status: Open</option>
                        <option value="monitoring">Status: Monitoring</option>
                        <option value="improving">Status: Improving</option>
                        <option value="worsening">Status: Worsening</option>
                        <option value="resolved">Status: Resolved</option>
                      </select>
                    </div>
                  </div>

                  {/* Diagnosis Assessment */}
                  <div className="p-4 rounded-2xl bg-krishi-50/60 border border-krishi-200/80">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-krishi-950 flex items-center space-x-1.5">
                        <Activity className="w-4 h-4 text-krishi-700" />
                        <span>{language === 'hi' ? 'वैज्ञानिक निदान विश्लेषण' : 'Source-Grounded Diagnosis'}</span>
                      </h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white text-krishi-800 border border-krishi-200">
                        Confidence: {selectedIssue.confidence}
                      </span>
                    </div>
                    <p className="text-base font-extrabold text-krishi-900 mt-1.5">
                      {selectedIssue.diagnosis_estimate || 'Preliminary Symptom Assessment'}
                    </p>
                    <div className="mt-3 text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {selectedIssue.guidance_notes}
                    </div>

                    {/* Voice audio playback button */}
                    {selectedIssue.guidance_notes && (
                      <div className="mt-4">
                        <AudioPlayerButton text={selectedIssue.guidance_notes} />
                      </div>
                    )}
                  </div>

                  {/* Expert Referral Warning if required */}
                  {selectedIssue.expert_referred && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-start space-x-3 text-amber-900">
                      <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider">{t.expert_referral_notice}</h4>
                        <p className="text-xs mt-0.5 leading-relaxed">{t.expert_referral_sub}</p>
                        {selectedIssue.expert_referral_reason && (
                          <p className="text-[11px] text-amber-800 italic mt-1">
                            Reason: {selectedIssue.expert_referral_reason}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Reported Symptoms */}
                  <div className="text-xs text-gray-700">
                    <strong className="text-gray-900">{t.symptoms_label}:</strong> {selectedIssue.reported_symptoms}
                  </div>
                </div>

                {/* Observation Timeline & Progression */}
                <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-6">
                  <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-krishi-700" />
                    <span>{language === 'hi' ? 'निरीक्षण व सुधार टाइमलाइन' : 'Symptom Timeline & Action Log'}</span>
                  </h3>

                  {/* New Observation Form */}
                  <form onSubmit={handleAddObservation} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                    <h4 className="text-xs font-bold text-gray-800">{t.record_observation}</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          {t.how_is_crop}
                        </label>
                        <select
                          value={obsChange}
                          onChange={(e: any) => setObsChange(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white font-medium"
                        >
                          <option value="same">{t.unchanged}</option>
                          <option value="improving">{t.improved}</option>
                          <option value="worsened">{t.worsened}</option>
                          <option value="resolved">{t.mark_resolved}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          {language === 'hi' ? 'उठाया गया कदम' : 'Action Taken'}
                        </label>
                        <input
                          type="text"
                          value={obsAction}
                          onChange={(e) => setObsAction(e.target.value)}
                          placeholder="e.g. Applied Trichoderma spray, cleared water"
                          className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        {language === 'hi' ? 'निरीक्षण विवरण' : 'Notes / Observation'}
                      </label>
                      <textarea
                        rows={2}
                        value={obsNotes}
                        onChange={(e) => setObsNotes(e.target.value)}
                        placeholder={language === 'hi' ? 'जैसे: नए पत्तों पर धब्बे नहीं हैं...' : 'Observation details...'}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="cursor-pointer inline-flex items-center space-x-1.5 text-xs text-krishi-700 font-semibold hover:text-krishi-900">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{obsPhoto ? obsPhoto.name : t.upload_photo}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files && setObsPhoto(e.target.files[0])}
                        />
                      </label>

                      <button
                        type="submit"
                        disabled={addingObs}
                        className="px-4 py-2 bg-krishi-700 hover:bg-krishi-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                      >
                        {addingObs ? 'Saving...' : t.submit}
                      </button>
                    </div>
                  </form>

                  {/* Timeline list */}
                  <div className="space-y-4 pt-2">
                    {selectedIssue.observations?.map((obs) => (
                      <div
                        key={obs.id}
                        className="p-4 rounded-2xl border border-gray-200 bg-white shadow-sm flex flex-col sm:flex-row gap-4"
                      >
                        {obs.image_url && (
                          <img
                            src={obs.image_url}
                            alt="Crop Observation"
                            className="w-24 h-24 object-cover rounded-xl border border-gray-200 shrink-0"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              obs.symptom_change === 'resolved' ? 'bg-green-100 text-green-800' :
                              obs.symptom_change === 'improving' ? 'bg-blue-100 text-blue-800' :
                              obs.symptom_change === 'worsened' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              Status: {obs.symptom_change}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(obs.created_at).toLocaleString()}
                            </span>
                          </div>

                          <p className="text-xs text-gray-800 mt-2 leading-relaxed">
                            {obs.notes}
                          </p>

                          {obs.action_taken && (
                            <p className="text-[11px] text-krishi-800 font-semibold mt-1.5">
                              Action taken: {obs.action_taken}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </>
            ) : (
              <div className="p-8 text-center bg-white rounded-3xl border border-gray-200 text-gray-500 text-xs">
                Select an issue from the list to view diagnostic analysis and timeline.
              </div>
            )}
          </div>

        </div>
      )}

      {/* Report Issue Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-krishi-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setReportModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{t.report_issue_btn}</h3>
            <p className="text-xs text-gray-500 mb-4">{language === 'hi' ? 'अपनी फसल के लक्षण दर्ज करें और फोटो जोड़ें' : 'Provide symptoms for source-grounded ICAR diagnostic assessment'}</p>

            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{t.crop_name} *</label>
                <select
                  value={cropId}
                  onChange={(e) => setCropId(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white font-medium"
                >
                  {crops.map((c) => (
                    <option key={c.id} value={c.id}>{c.crop_name} ({c.farm_name || 'Farm'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {language === 'hi' ? 'समस्या का शीर्षक (वैकल्पिक)' : 'Issue Title (Optional)'}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Spindle spots on leaves"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-krishi-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{t.symptoms_label} *</label>
                <textarea
                  required
                  rows={3}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder={t.symptoms_placeholder}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-krishi-600 outline-none"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{t.upload_photo}</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-2xl hover:border-krishi-500 transition-colors">
                  <div className="space-y-2 text-center">
                    {photoPreview ? (
                      <div className="relative inline-block">
                        <img src={photoPreview} alt="Preview" className="h-32 w-auto object-cover rounded-xl" />
                        <button
                          type="button"
                          onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
                        <div className="flex text-xs text-gray-600">
                          <label className="relative cursor-pointer font-semibold text-krishi-700 hover:text-krishi-800">
                            <span>{t.take_photo}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={handlePhotoSelect}
                            />
                          </label>
                        </div>
                        <p className="text-[11px] text-gray-400">PNG, JPG, WEBP up to 5MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={reporting}
                  className="flex-1 py-2.5 bg-krishi-700 hover:bg-krishi-800 text-white font-bold text-xs rounded-xl shadow"
                >
                  {reporting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t.submit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
