export interface Collaborator {
  id: string;
  name: string;
  role: 'N1' | 'N2';
  created_at: string;
  updated_at: string;
}

export interface FeedbackAnalysis {
  id: string;
  collaborator_id: string;
  week_start: string;
  analysis_date: string;
  tone_attendant: string | null;
  tone_client: string | null;
  complaints_count: number;
  questions_count: number;
  processes_executed: string[] | null;
  resolution_status: string | null;
  summary: string | null;
  insights: string[] | null;
  feedback: string | null;
  engagement_level: 'positive' | 'neutral' | 'negative' | null;
  strengths: string[] | null;
  improvements: string[] | null;
  patterns: string[] | null;
  created_at: string;
  // New structured fields
  transfer_detected: boolean | null;
  transfer_reason: string | null;
  instance_code_requested: boolean | null;
  client_sentiment_start: string | null;
  client_sentiment_end: string | null;
  robotic_communication: boolean | null;
  robotic_communication_details: string | null;
  efficiency_conclusion: string | null;
  top_phrases: string[] | null;
}

export interface AnalysisFile {
  id: string;
  analysis_id: string;
  file_path: string;
  file_name: string;
  file_type: string;
  created_at: string;
}

export interface AnalysisResult {
  tone_attendant: string;
  tone_client: string;
  complaints_count: number;
  questions_count: number;
  processes_executed: string[];
  resolution_status: string;
  summary: string;
  insights: string[];
  patterns: string[];
  strengths: string[];
  improvements: string[];
  engagement_level: 'positive' | 'neutral' | 'negative';
  feedback: string;
  // New structured fields
  transfer_detected: boolean;
  transfer_reason: string | null;
  instance_code_requested: boolean;
  client_sentiment_start: string;
  client_sentiment_end: string;
  robotic_communication: boolean;
  robotic_communication_details: string | null;
  efficiency_conclusion: string;
  top_phrases: string[];
}

export type ManualFeedbackStatus = 'pending' | 'completed' | 'cancelled';
export type ManualFeedbackCategory = 'performance' | 'behavior' | 'recognition' | 'other';

export interface ManualFeedback {
  id: string;
  collaborator_id: string;
  feedback_date: string;
  status: ManualFeedbackStatus;
  category: ManualFeedbackCategory | null;
  observations: string | null;
  created_at: string;
  updated_at: string;
}
 
export interface CollaboratorProfile {
  id: string;
  collaborator_id: string;
  work_start_time: string | null;
  work_end_time: string | null;
  work_days: string[] | null;
  technical_level: number | null;
  communication_level: number | null;
  main_difficulties: string[] | null;
  created_at: string;
  updated_at: string;
}
 
export type WarningType = 'verbal' | 'escrita' | 'suspensao';
 
export interface CollaboratorWarning {
  id: string;
  collaborator_id: string;
  warning_date: string;
  type: WarningType;
  reason: string;
  details: string | null;
  created_by: string | null;
  created_at: string;
}
 
export type AttentionFlagSeverity = 'baixa' | 'media' | 'alta' | 'critica';
export type AttentionFlagStatus = 'ativo' | 'resolvido' | 'monitorando';
 
export interface AttentionFlag {
  id: string;
  collaborator_id: string;
  flag_date: string;
  severity: AttentionFlagSeverity;
  description: string;
  status: AttentionFlagStatus;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}

export type DevelopmentPlanStatus = 'in_progress' | 'completed' | 'cancelled';
export type DevelopmentPlanCategory = 'technical_training' | 'shadowing' | 'communication' | 'process' | 'other';
export type DevelopmentPlanPriority = 'low' | 'medium' | 'high';
export type DevelopmentPlanSource = 'manual' | 'ai_recommendation';

export interface DevelopmentPlan {
  id: string;
  collaborator_id: string;
  title: string;
  description: string | null;
  category: DevelopmentPlanCategory;
  status: DevelopmentPlanStatus;
  priority: DevelopmentPlanPriority;
  source: DevelopmentPlanSource;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}