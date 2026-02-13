
export type TransactionType = 'import' | 'export';

export interface LineItemClassification {
  line_item: string;
  suggested_hs_8: string;
  gir_applied: string;
  legal_justification: string;
  confidence_score: number; // 0.0 to 1.0
  png_customs_notes: string;
  valuation_adjustment: string;
}

export interface ClassificationRequest {
  description: string;
  country: string;
  transactionType: TransactionType;
  files: File[];
}
