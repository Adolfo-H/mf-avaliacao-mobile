export type AnamnesisObjective =
  | 'muscle_mass'
  | 'aerobic_capacity'
  | 'health_quality_of_life'
  | 'muscle_strengthening'
  | 'general_conditioning'
  | 'weight_loss'
  | 'other';

export type SpinePainRegion =
  | 'thoracic'
  | 'lumbar'
  | 'cervical';

export type ParqExternalFormReference = {
  version: string;
  completed_on: string;
  document_reference: string;
  source_url?: string;
  recorded_at?: string;
  recorded_by?: number;
};

export type AssessmentAnamnesisPayload = {
  parq_external?: ParqExternalFormReference;
  objectives?: AnamnesisObjective[];

  objective_other?: string | null;

  exercises_regularly?: boolean | null;

  exercise_activity?: string | null;

  exercise_frequency_per_week?:
    | number
    | null;

  exercise_duration_minutes?:
    | number
    | null;

  spine_pain_regions?: SpinePainRegion[];

  joint_limitations?: string | null;

  recent_surgery?: boolean | null;

  surgery_type?: string | null;

  surgery_date?: string | null;

  medications?: string | null;

  health_problems?: string | null;

  clinical_notes?: string | null;

  resting_heart_rate?: number | null;

  systolic_blood_pressure?:
    | number
    | null;

  diastolic_blood_pressure?:
    | number
    | null;
};

export type ParqQuestion = {
  id: number;

  uuid: string;

  key: string;

  version: number;

  position: number;

  text: string;

  answer: boolean | null;
};

export type ParqData = {
  configured: boolean;
  external_form_registered?: boolean;
  external_form_status?: string;

  questions: ParqQuestion[];

  answered_count: number;

  total_questions: number;

  has_positive_answer: boolean;

  medical_alert: boolean;
};

export type AnamnesisSectionData = {
  status:
    | 'not_started'
    | 'in_progress'
    | 'completed'
    | 'pending'
    | null;

  status_label: string | null;

  started_at: string | null;

  completed_at: string | null;
};

export type AssessmentAnamnesis = {
  assessment_uuid: string;

  anamnesis: AssessmentAnamnesisPayload;

  parq: ParqData;

  section: AnamnesisSectionData;
};

export type AssessmentAnamnesisResponse = {
  data: AssessmentAnamnesis;
};

export type ParqAnswerPayload = {
  question_version_id: number;
  answer: boolean;
};

export type UpdateAssessmentAnamnesisPayload =
  AssessmentAnamnesisPayload & {
    parq_answers?: ParqAnswerPayload[];
  };