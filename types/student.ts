export type StudentSex =
  | 'male'
  | 'female'
  | 'other'
  | 'not_informed';

export type StudentAddress = {
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
};

export type StudentContact = {
  mobile_phone: string | null;
  home_phone: string | null;
  email: string | null;
};

export type Student = {
  uuid: string;

  has_photo: boolean;

  name: string;

  birth_date: string | null;

  age: number | null;

  sex: StudentSex | null;

  address: StudentAddress | null;

  contact: StudentContact | null;

  active: boolean;

  archived: boolean;

  administrative_notes: string | null;

  created_at: string | null;

  updated_at: string | null;
};

export type CreateStudentPayload = {
  name: string;

  birth_date?: string | null;

  sex?: StudentSex | null;

  address?: string | null;

  address_number?: string | null;

  address_complement?: string | null;

  neighborhood?: string | null;

  city?: string | null;

  state?: string | null;

  mobile_phone?: string | null;

  home_phone?: string | null;

  email?: string | null;

  active?: boolean;

  administrative_notes?: string | null;
};

export type UpdateStudentPayload =
  Partial<CreateStudentPayload>;

export type StudentResponse = {
  data: Student;
};

export type StudentListResponse = {
  data: Student[];

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

export type StudentStatus =
  | 'active'
  | 'inactive'
  | 'archived';