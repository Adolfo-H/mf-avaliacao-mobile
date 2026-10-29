import type { ProgressPhotoPosition } from '@/types/progress-photos';

export type PhotoComparisonAssessment = {
  uuid: string;
  evaluation_date: string;
  status: 'completed';
  evaluator: { id: number | null; name: string | null };
};

export type PhotoComparisonItem = {
  has_photo: boolean;
  captured_at: string | null;
  observation: string | null;
};

export type PhotoComparisonPosition = {
  position: ProgressPhotoPosition;
  label: string;
  both_available: boolean;
  base: PhotoComparisonItem;
  target: PhotoComparisonItem;
};

export type AssessmentPhotoComparisonResponse = {
  data: {
    student: { uuid: string; name: string };
    base: PhotoComparisonAssessment;
    target: PhotoComparisonAssessment;
    positions: PhotoComparisonPosition[];
    available_pairs: number;
    note: string;
  };
};
