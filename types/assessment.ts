export type AssessmentStatus =
  | 'draft'
  | 'completed';

export type AssessmentStudent = {
  uuid: string;
  name: string;
  age_at_evaluation: number | null;
  current_age: number | null;
  has_photo: boolean;
  active: boolean;
};

export type AssessmentEvaluator = {
  id: number;
  name: string;
  email: string;
  active: boolean;
};

export type AssessmentUser = {
  id: number;
  name: string;
};

export type Assessment = {
  uuid: string;

  evaluation_date: string;

  status: AssessmentStatus;

  status_label: string | null;

  completed_at: string | null;

  can_edit: boolean;

  student: AssessmentStudent;

  evaluator: AssessmentEvaluator;

  created_by: AssessmentUser;

  updated_by: AssessmentUser | null;

  created_at: string | null;

  updated_at: string | null;
};

export type AssessmentResponse = {
  data: Assessment;
};

export type AssessmentListResponse = {
  data: Assessment[];

  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };

  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
  };
};

export type CreateAssessmentPayload = {
  student_uuid: string;
  evaluator_id: number;
  evaluation_date: string;
};

export type UpdateAssessmentPayload =
  Partial<CreateAssessmentPayload>;

export type ListAssessmentsOptions = {
  search?: string;

  student_uuid?: string;

  evaluator_id?: number;

  status?: AssessmentStatus;

  date_from?: string;

  date_to?: string;

  page?: number;
};