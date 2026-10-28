export interface User {
  id: number;
  username: string;
  email: string | null;
  phone: string | null;
  role: 'farmer' | 'admin';
  is_active: boolean;
  has_profile: boolean;
  created_at: string;
}

export interface FarmerProfile {
  id: number;
  user_id: number;
  full_name: string;
  preferred_language: string;
  phone_number: string | null;
  village: string | null;
  district: string | null;
  state: string | null;
  country: string;
  pincode: string | null;
  notification_sms: boolean;
  notification_whatsapp: boolean;
  notification_voice: boolean;
  notification_in_app: boolean;
  quiet_hours_start: number;
  quiet_hours_end: number;
  location_consent: boolean;
  notification_consent: boolean;
  created_at: string;
}

export interface Farm {
  id: number;
  user_id: number;
  name: string;
  latitude: number | null;
  longitude: number | null;
  size_value: number | null;
  size_unit: string;
  soil_type: string | null;
  irrigation_method: string | null;
  drainage_issues: boolean;
  notes: string | null;
  is_active: boolean;
  crop_count: number;
  created_at: string;
}

export interface CropCycle {
  id: number;
  farm_id: number;
  farm_name: string | null;
  user_id: number;
  crop_name: string;
  variety: string | null;
  sowing_date: string | null;
  expected_harvest_date: string | null;
  growth_stage: string;
  plot_identifier: string | null;
  status: 'active' | 'harvested' | 'abandoned';
  notes: string | null;
  active_issues_count: number;
  created_at: string;
}

export interface IssueObservation {
  id: number;
  issue_id: number;
  user_id: number;
  notes: string;
  image_url: string | null;
  audio_url: string | null;
  symptom_change: 'same' | 'improving' | 'worsened' | 'resolved';
  action_taken: string | null;
  created_at: string;
}

export interface CropIssue {
  id: number;
  crop_id: number;
  crop_name: string | null;
  farm_name: string | null;
  user_id: number;
  title: string;
  reported_symptoms: string;
  status: 'open' | 'monitoring' | 'improving' | 'worsening' | 'resolved';
  diagnosis_estimate: string | null;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  confidence: 'preliminary' | 'probable' | 'confirmed';
  guidance_notes: string | null;
  sources_cited: string | null;
  expert_referred: boolean;
  expert_referral_reason: string | null;
  observations_count: number;
  latest_observation?: IssueObservation | null;
  observations?: IssueObservation[];
  created_at: string;
  updated_at: string;
}

export interface KnowledgeSource {
  institution: string;
  source_url?: string;
  topic?: string;
  year?: string;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  user_id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  audio_url: string | null;
  language: string;
  sources_used?: KnowledgeSource[];
  suggested_actions?: string[];
  created_at: string;
}

export interface Conversation {
  id: number;
  user_id: number;
  crop_id: number | null;
  title: string;
  message_count: number;
  latest_message?: ChatMessage | null;
  messages?: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface WeatherAlert {
  id: number;
  user_id: number;
  farm_id: number | null;
  title: string;
  description: string;
  severity: 'advisory' | 'watch' | 'warning' | 'severe';
  hazard_type: string;
  source: string;
  is_official_warning: boolean;
  valid_from: string;
  valid_to: string;
  is_acknowledged: boolean;
  created_at: string;
}

export interface WeatherData {
  location_label: string;
  farm_id: number | null;
  latitude?: number;
  longitude?: number;
  is_auto_detected?: boolean;
  weather: {
    success: boolean;
    latitude: number;
    longitude: number;
    timezone: string;
    fetched_at: string;
    is_stale: boolean;
    source: string;
    current: {
      temperature: number;
      feels_like: number;
      humidity: number;
      precipitation_mm: number;
      wind_speed_kmh: number;
      weather_code: number;
      condition: string;
    };
    daily: {
      time: string[];
      weather_code: number[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      precipitation_sum: number[];
      precipitation_probability_max: number[];
    };
  };
  alerts: WeatherAlert[];
}

export interface FollowUpTask {
  id: number;
  user_id: number;
  crop_issue_id: number;
  issue_title: string | null;
  scheduled_for: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'failed';
  reason: string;
  prompt_question: string;
  delivery_channel: string;
  attempts: number;
  last_attempt_at: string | null;
  completed_at: string | null;
  result_notes: string | null;
  created_at: string;
}

export interface NotificationRecord {
  id: number;
  user_id: number;
  follow_up_id: number | null;
  channel: string;
  title: string;
  message: string;
  status: string;
  read_at: string | null;
  created_at: string;
}
