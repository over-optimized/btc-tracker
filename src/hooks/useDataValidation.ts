/**
 * Data Validation Hook
 * Manages startup data validation and user-friendly migration/reset workflows
 */

import { useState, useEffect } from 'react';
import { ValidationResult, validateStoredData } from '../utils/dataValidation';

export interface DataValidationState {
  isValidating: boolean;
  validationResult: ValidationResult | null;
  needsUserAction: boolean;
  showValidationModal: boolean;
}

export const useDataValidation = () => {
  const [state, setState] = useState<DataValidationState>({
    isValidating: true,
    validationResult: null,
    needsUserAction: false,
    showValidationModal: false
  });

  // Perform validation on hook initialization
  useEffect(() => {
    performValidation();
  }, []);

  const performValidation = async () => {
    setState(prev => ({ ...prev, isValidating: true }));

    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const result = validateStoredData();
      
      const needsUserAction = !result.isValid;
      const showModal = needsUserAction;

      setState({
        isValidating: false,
        validationResult: result,
        needsUserAction,
        showValidationModal: showModal
      });

    } catch (error) {
      console.error('Data validation failed:', error);
      
      // On validation error, assume we need user action
      setState({
        isValidating: false,
        validationResult: {
          isValid: false,
          errors: [{
            type: 'CORRUPT_DATA',
            message: 'Unable to validate stored data',
            details: 'Data may be corrupted'
          }],
          warnings: [],
          canMigrate: false,
          requiresReset: true,
          migratableTransactions: 0,
          invalidTransactions: 0
        },
        needsUserAction: true,
        showValidationModal: true
      });
    }
  };

  const handleValidationComplete = () => {
    setState(prev => ({
      ...prev,
      showValidationModal: false,
      needsUserAction: false
    }));
  };

  const handleDataReset = () => {
    setState(prev => ({
      ...prev,
      showValidationModal: false,
      needsUserAction: false,
      validationResult: {
        isValid: true,
        errors: [],
        warnings: [],
        canMigrate: false,
        requiresReset: false,
        migratableTransactions: 0,
        invalidTransactions: 0
      }
    }));
  };

  return {
    ...state,
    handleValidationComplete,
    handleDataReset,
    retryValidation: performValidation
  };
};