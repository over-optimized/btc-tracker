export enum ImportErrorType {
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  INVALID_CSV_FORMAT = 'INVALID_CSV_FORMAT',
  MISSING_REQUIRED_COLUMNS = 'MISSING_REQUIRED_COLUMNS',
  INVALID_DATA_VALUES = 'INVALID_DATA_VALUES',
  EMPTY_FILE = 'EMPTY_FILE',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

export interface ImportError {
  type: ImportErrorType;
  message: string;
  details?: string;
  rowNumber?: number;
  suggestions?: string[];
  recoverable: boolean;
}

export interface ImportResult {
  success: boolean;
  importedCount: number;
  ignoredCount: number;
  errors: ImportError[];
  warnings: ImportError[];
  summary: string;
}

export interface ValidationWarning extends Omit<ImportError, 'type'> {
  type: 'SUSPICIOUS_DATA' | 'PARTIAL_MATCH' | 'FORMAT_INCONSISTENCY';
}

export interface FileValidationResult {
  isValid: boolean;
  fileSize: number;
  lineCount: number;
  errors: ImportError[];
  warnings: ValidationWarning[];
}

export interface RecoveryOption {
  id: string;
  label: string;
  description: string;
  action: 'retry' | 'skip' | 'modify' | 'export';
  data?: any;
}

export interface ErrorRecoveryContext {
  originalFile?: File;
  processedData?: any[];
  failedRows?: number[];
  detectedFormat?: string;
  recoveryOptions: RecoveryOption[];
}