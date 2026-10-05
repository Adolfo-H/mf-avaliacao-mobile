export type PosturalOption = { key: string; label: string };

export type PosturalPhotoPosition =
  | 'right_lateral'
  | 'left_lateral'
  | 'posterior'
  | 'anterior';

export type PosturalPhoto = {
  position: PosturalPhotoPosition;
  label: string;
  has_photo: boolean;
  grid_enabled: boolean;
  grid_settings: Record<string, unknown> | null;
  observation: string | null;
  captured_at: string | null;
  uploaded_at: string | null;
};

export type PosturalAssessmentPayload = {
  lateral?: { alterations?: string[] };
  posterior?: { alterations?: string[] };
  anterior?: {
    alterations?: string[];
    shoulder_asymmetry?: string | null;
    hip_asymmetry?: string | null;
  };
  observations?: string | null;
};

export type AssessmentPostural = {
  assessment_uuid: string;
  evaluation_date: string;
  postural_assessment: {
    lateral: { alterations: string[] };
    posterior: { alterations: string[] };
    anterior: {
      alterations: string[];
      shoulder_asymmetry: string | null;
      hip_asymmetry: string | null;
    };
    observations: string | null;
  };
  photos: PosturalPhoto[];
  photo_consent: {
    active: boolean;
    storage_authorized: boolean;
    external_use_allowed: boolean;
    revoked_at: string | null;
  } | null;
  configuration: {
    lateral_alterations: PosturalOption[];
    posterior_alterations: PosturalOption[];
    anterior_alterations: PosturalOption[];
    shoulder_asymmetries: PosturalOption[];
    hip_asymmetries: PosturalOption[];
    photo_positions: PosturalOption[];
    symmetrograph_available: boolean;
  };
  section: {
    status: 'not_started' | 'in_progress' | 'completed' | 'pending' | null;
    status_label: string | null;
    started_at: string | null;
    completed_at: string | null;
  };
};

export type AssessmentPosturalResponse = { data: AssessmentPostural };
export type UpdatePosturalPayload = PosturalAssessmentPayload;
export type UpdatePosturalPhotoPayload = {
  grid_enabled?: boolean;
  grid_settings?: Record<string, unknown> | null;
  observation?: string | null;
  captured_at?: string | null;
};
