import { useState, useCallback } from "react";
import type { ValidationErrors } from "../utils/validation";

export function useValidation() {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const setError = useCallback((field: string, error: string | undefined) => {
    setErrors((prev: ValidationErrors) => {
      const next = { ...prev };
      if (error === undefined) {
        delete next[field];
      } else {
        next[field] = error;
      }
      return next;
    });
  }, []);

  const clearError = useCallback((field: string) => {
    setErrors((prev: ValidationErrors) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const hasErrors = Object.values(errors).some((e) => e.length > 0);

  return {
    errors,
    setError,
    clearError,
    clearAllErrors,
    hasErrors,
  }
}