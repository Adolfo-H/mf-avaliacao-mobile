export type BillingStatus = 'open' | 'due_today' | 'overdue' | 'paid' | 'cancelled';
export type BillingStudent = { uuid: string; name: string; active: boolean; archived: boolean };
export type BillingInvoice = {
  uuid: string; reference_month: string; due_date: string; amount_cents: number;
  status: BillingStatus; revision: number; paid_on: string | null; payment_method: string | null;
  student: BillingStudent; whatsapp_consent: boolean; phone_configured: boolean;
};
export type BillingAccount = {
  student: BillingStudent; configured: boolean; revision: number; amount_cents: number | null;
  due_day: number; start_month: string; enabled: boolean; whatsapp_phone: string;
  whatsapp_consent: boolean; consent_note: string; consented_at: string | null;
};
export type BillingAccountInput = Pick<BillingAccount, 'revision' | 'due_day' | 'start_month' | 'enabled' | 'whatsapp_phone' | 'whatsapp_consent' | 'consent_note'> & { amount_cents: number };
export type BillingEvent = { id: number; action: string; actor_id: number | null; created_at: string; details: Record<string, unknown> };
export type BillingAccountResponse = { data: BillingAccount; invoices: BillingInvoice[]; events: BillingEvent[] };
export type BillingReminder = { uuid: string; channel: 'manual' | 'cloud'; status: string; created_at: string; provider_id: string | null; error_code: string | null };
export type BillingPreview = { invoice: BillingInvoice; account_revision: number; message: string; recipient: string | null; can_send: boolean; blocked_reasons: string[]; cloud_configured: boolean; last_reminder: BillingReminder | null };
export type BillingSettings = { studio_name: string; studio_phone: string; timezone: string; today: string; current_month: string; cloud_configured: boolean; manual_available: boolean; template: string; cooldown_hours: number; note: string };
export type BillingList = { data: BillingInvoice[]; meta: { current_page: number; last_page: number; total: number }; summary: { total: number; received_cents: number; outstanding_cents: number; overdue_cents: number; paid_count: number; overdue_count: number }; today: string };
export type BillingSendResult = { data: BillingReminder; whatsapp_url: string | null };
