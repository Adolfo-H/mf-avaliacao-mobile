export type ProgressPhotoPosition =
  | 'front'
  | 'back_flexed'
  | 'front_flexed'
  | 'side';

export type PhotoConsent = {
  purpose: string;
  consent_date: string;
  external_use_allowed: boolean;
  storage_authorized: boolean;
  revoked_at: string | null;
  active: boolean;
};

export type ProgressPhotoItem = {
  position: ProgressPhotoPosition;
  label: string;
  has_photo: boolean;
  observation: string | null;
  captured_at: string | null;
  uploaded_at: string | null;
};

export type ProgressPhotoSection = {
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

export type AssessmentProgressPhotos = {
  assessment_uuid: string;
  evaluation_date: string;
  consent: PhotoConsent | null;
  positions: ProgressPhotoItem[];
  previous: {
    assessment_uuid: string;
    evaluation_date: string;
    positions: ProgressPhotoItem[];
  } | null;
  section: ProgressPhotoSection;
};

export type AssessmentProgressPhotosResponse = {
  data: AssessmentProgressPhotos;
};

export type UpdatePhotoConsentPayload = {
  purpose: string;
  consent_date: string;
  external_use_allowed: boolean;
  storage_authorized: boolean;
};
