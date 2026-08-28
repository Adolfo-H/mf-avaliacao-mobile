export type EvaluatorProfile = {
  phone: string | null;
  professional_registration: string | null;
  specialty: string | null;
  company_name: string | null;
  photo_path: string | null;
  signature_path: string | null;
  company_logo_path: string | null;
};

export type Evaluator = {
  id: number;
  name: string;
  email: string;
  role: 'evaluator';
  active: boolean;
  profile: EvaluatorProfile | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CreateEvaluatorPayload = {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  professional_registration?: string | null;
  specialty?: string | null;
  company_name?: string | null;
  active?: boolean;
};

export type UpdateEvaluatorPayload = {
  name?: string;
  email?: string;
  password?: string;
  phone?: string | null;
  professional_registration?: string | null;
  specialty?: string | null;
  company_name?: string | null;
};

export type EvaluatorStatusPayload = {
  active: boolean;
};

export type EvaluatorListResponse = {
  data: Evaluator[];

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

export type EvaluatorResponse = {
  data: Evaluator;
};