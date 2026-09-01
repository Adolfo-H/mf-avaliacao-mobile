export type AssessmentEvaluatorOption = {
  id: number;
  name: string;
  email: string;
};

export type AssessmentEvaluatorListResponse = {
  data: AssessmentEvaluatorOption[];
};