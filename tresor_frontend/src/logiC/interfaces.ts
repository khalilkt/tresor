export interface PaginatedData<T> {
  count: number;
  page: number;
  total_pages: number;
  data: T[];
}

export interface AccountInterface {
  name: string;
  balance: number;
  id: number;
  number: string;
  created_at: string;
  updated_at: string;
}

type CollectionOperationType = "operation" | "versement" | "rejected";

export interface CollectionOperationInterface {
  id: number;
  total: number;
  date: string;
  ref: string;
  motif: string;
  beneficiaire: string;
  created_at: string;
  details: CollectionOperationDetail[];
  type: CollectionOperationType;
}

export interface CollectionOperationDetail {
  montant: number;
  name: string;
  banq_name: string;
  created_at: string;
  cheque_number: string;

  destination_account: number;
  account_data: AccountInterface;
}

type DisbursementOperationType = "operation" | "frais";

export interface DisbursementOperationInterface {
  date: string;
  motif: string;
  beneficiaire: string;
  account: number;
  details: DisbursementOperationDetail[];
  type: DisbursementOperationType;

  account_data: AccountInterface;
  id: number;
  total: number;
  ref: string;
  created_at: string;
  account_name: string;
}

export interface DisbursementOperationDetail {
  montant: number;
  name: string;
  banq_name: string;
  banq_number: string;
  created_at: string;
}

export interface UserInterface {
  id: number;
  username: string;
  name: string;
  is_admin: boolean;
  is_superuser: boolean;
  total_collection_operations: number;
  total_disbursement_operations: number;
}
