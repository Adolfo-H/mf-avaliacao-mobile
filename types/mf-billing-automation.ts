export type BillingAutomationSettings = {
  enabled: boolean;
  sender_phone: string;
  first_after_days: number;
  repeat_interval_days: number;
  max_reminders: number;
  send_time: string;
  templates: string[];
  revision: number;
  timezone: string;
  server_armed: boolean;
  worker_online: boolean;
  worker_matches_sender: boolean;
  worker_seen_at: string | null;
  daily_cap: number;
  note: string;
};
export type BillingAutomationJob = {
  uuid: string;
  step: number;
  status: 'reserved' | 'sending' | 'sent' | 'unknown' | 'not_sent' | 'cancelled';
  student_name: string;
  reference_month: string;
  created_at: string | null;
  completed_at: string | null;
  error_code: string | null;
};
export type BillingAutomationInput = Pick<
  BillingAutomationSettings,
  'enabled' | 'sender_phone' | 'first_after_days' | 'repeat_interval_days' |
  'max_reminders' | 'send_time' | 'templates' | 'revision'
>;
