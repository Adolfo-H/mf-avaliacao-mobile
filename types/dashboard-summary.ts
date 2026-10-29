export type DashboardRecentAssessment = {
  uuid: string;
  evaluation_date: string | null;
  status: 'draft' | 'completed';
  status_label: string;
  student: { uuid: string | null; name: string | null };
};

export type DashboardSummary = {
  scope: 'admin' | 'evaluator' | 'reception';
  students: { count: number; label: string };
  assessments: {
    total: number;
    draft: number;
    completed: number;
  } | null;
  recent: DashboardRecentAssessment[];
  permissions: { can_view_assessments: boolean };
  generated_at: string;
};

export type DashboardSummaryResponse = { data: DashboardSummary };
