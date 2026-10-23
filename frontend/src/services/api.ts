import { 
  User, 
  FarmerProfile, 
  Farm, 
  CropCycle, 
  CropIssue, 
  IssueObservation, 
  Conversation, 
  ChatMessage, 
  WeatherData, 
  FollowUpTask, 
  NotificationRecord 
} from '../types';

const API_BASE = '/api/v1';

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

function getAuthHeaders(isFormData = false): Record<string, string> {
  const token = localStorage.getItem('krishivaani_token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...getAuthHeaders(isFormData),
    ...(options.headers as Record<string, string> || {})
  };

  const resp = await fetch(url, { ...options, headers });
  
  if (resp.status === 204) {
    return {} as T;
  }

  const contentType = resp.headers.get('content-type') || '';
  if (contentType.includes('audio/')) {
    const blob = await resp.blob();
    return blob as unknown as T;
  }

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new ApiError(resp.status, data.error || data.message || `Request failed with status ${resp.status}`, data);
  }
  return data as T;
}

export const api = {
  // Auth
  async register(body: any): Promise<{ token: string; user: User; profile: FarmerProfile }> {
    return request('/auth/register', { method: 'POST', body: JSON.stringify(body) });
  },

  async login(identifier: string, password: string): Promise<{ token: string; user: User; profile: FarmerProfile }> {
    return request('/auth/login', { method: 'POST', body: JSON.stringify({ username: identifier, password }) });
  },

  async logout(): Promise<void> {
    await request('/auth/logout', { method: 'POST' });
  },

  async getMe(): Promise<{ user: User; profile: FarmerProfile | null }> {
    return request('/auth/me');
  },

  async updateProfile(profileData: Partial<FarmerProfile>): Promise<{ profile: FarmerProfile }> {
    return request('/auth/profile', { method: 'PATCH', body: JSON.stringify(profileData) });
  },

  async deleteAccount(): Promise<void> {
    await request('/auth/account', { method: 'DELETE' });
  },

  // Farms
  async getFarms(): Promise<{ farms: Farm[]; total: number }> {
    return request('/farms');
  },

  async createFarm(farm: Partial<Farm>): Promise<{ farm: Farm }> {
    return request('/farms', { method: 'POST', body: JSON.stringify(farm) });
  },

  async updateFarm(id: number, farm: Partial<Farm>): Promise<{ farm: Farm }> {
    return request(`/farms/${id}`, { method: 'PATCH', body: JSON.stringify(farm) });
  },

  async deleteFarm(id: number): Promise<void> {
    await request(`/farms/${id}`, { method: 'DELETE' });
  },

  // Crops
  async getCrops(farmId?: number): Promise<{ crops: CropCycle[]; total: number }> {
    const query = farmId ? `?farm_id=${farmId}` : '';
    return request(`/crops${query}`);
  },

  async createCrop(crop: Partial<CropCycle>): Promise<{ crop: CropCycle }> {
    return request('/crops', { method: 'POST', body: JSON.stringify(crop) });
  },

  async updateCrop(id: number, crop: Partial<CropCycle>): Promise<{ crop: CropCycle }> {
    return request(`/crops/${id}`, { method: 'PATCH', body: JSON.stringify(crop) });
  },

  async deleteCrop(id: number): Promise<void> {
    await request(`/crops/${id}`, { method: 'DELETE' });
  },

  // Crop Issues
  async getIssues(cropId?: number, status?: string): Promise<{ issues: CropIssue[]; total: number }> {
    const params = new URLSearchParams();
    if (cropId) params.append('crop_id', cropId.toString());
    if (status) params.append('status', status);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/crop-issues${qs}`);
  },

  async getIssue(id: number): Promise<{ issue: CropIssue }> {
    return request(`/crop-issues/${id}`);
  },

  async reportIssue(formData: FormData): Promise<{ issue: CropIssue; analysis: any }> {
    return request('/crop-issues', { method: 'POST', body: formData });
  },

  async updateIssueStatus(id: number, status: string): Promise<{ issue: CropIssue }> {
    return request(`/crop-issues/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
  },

  async addObservation(issueId: number, formData: FormData): Promise<{ observation: IssueObservation; issue: CropIssue }> {
    return request(`/crop-issues/${issueId}/observations`, { method: 'POST', body: formData });
  },

  // Conversations & RAG Chat
  async getConversations(): Promise<{ conversations: Conversation[]; total: number }> {
    return request('/conversations');
  },

  async createConversation(title?: string, cropId?: number): Promise<{ conversation: Conversation }> {
    return request('/conversations', { method: 'POST', body: JSON.stringify({ title, crop_id: cropId }) });
  },

  async getConversation(id: number): Promise<{ conversation: Conversation }> {
    return request(`/conversations/${id}`);
  },

  async sendMessage(conversationId: number, content: string, language: string, audioUrl?: string): Promise<{ user_message: ChatMessage; assistant_message: ChatMessage }> {
    return request(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, language, audio_url: audioUrl })
    });
  },

  // Voice (Gnani AI STT & TTS)
  async transcribeVoice(audioBlob: Blob, language = 'hi'): Promise<{ success: boolean; transcript: string }> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('language', language);
    return request('/voice/transcribe', { method: 'POST', body: formData });
  },

  async synthesizeVoice(text: string, language = 'hi'): Promise<Blob> {
    return request('/voice/synthesize', {
      method: 'POST',
      body: JSON.stringify({ text, language })
    });
  },

  async getVoiceHealth(): Promise<any> {
    return request('/voice/health');
  },

  // Weather & IMD alerts
  async getWeather(farmId?: number): Promise<WeatherData> {
    const qs = farmId ? `?farm_id=${farmId}` : '';
    return request(`/weather${qs}`);
  },

  // Follow-ups
  async getFollowUps(status?: string): Promise<{ follow_ups: FollowUpTask[]; total: number }> {
    const qs = status ? `?status=${status}` : '';
    return request(`/follow-ups${qs}`);
  },

  async respondToFollowUp(taskId: number, outcome: string, notes?: string, actionTaken?: string): Promise<{ follow_up: FollowUpTask }> {
    return request(`/follow-ups/${taskId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ outcome, notes, action_taken: actionTaken })
    });
  },

  async cancelFollowUp(taskId: number): Promise<{ follow_up: FollowUpTask }> {
    return request(`/follow-ups/${taskId}/cancel`, { method: 'POST' });
  },

  // Notifications
  async getNotifications(): Promise<{ notifications: NotificationRecord[]; unread_count: number; total: number }> {
    return request('/notifications');
  },

  async markNotificationRead(id: number): Promise<void> {
    await request(`/notifications/${id}/read`, { method: 'PATCH' });
  },

  // Admin
  async getAdminHealth(): Promise<any> {
    return request('/admin/health');
  },

  async getAdminSystemStatus(): Promise<any> {
    return request('/admin/system-status');
  },

  async getAdminAuditLogs(page = 1): Promise<any> {
    return request(`/admin/audit-logs?page=${page}`);
  }
};
