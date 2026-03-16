import { VALIDATION_RULES } from "./constants";
import type { ValidationResult } from "../types/ui";

export type ValidationErrors = Record<string, string>;

export function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ');
}

export function validateQuestTitle(title: string): ValidationResult {
  const sanitized = sanitizeText(title);

  if(!sanitized) {
    return { isValid: false, error: 'title is required' };
  }

  if(sanitized.length < VALIDATION_RULES.TITLE_MIN) {
    return { isValid: false, error: `title must be at least ${VALIDATION_RULES.TITLE_MIN} characters`}
  }
  if (sanitized.length > VALIDATION_RULES.TITLE_MAX) {
    return { isValid: false, error: `title must be less than ${VALIDATION_RULES.TITLE_MAX} characters` };
  }

  return { isValid: true };
}

export function validateQuestDescription(description: string): ValidationResult {
  if (description.length > VALIDATION_RULES.DESCRIPTION_MAX) {
    return { isValid: false, error: `description must be less than ${VALIDATION_RULES.DESCRIPTION_MAX} characters`}
  }
  return { isValid: true };
}

export function validateCategoryName(name: string): ValidationResult {
  const sanitized = sanitizeText(name);

  if(!sanitized) {
    return { isValid: false, error: 'category name cannot be empty' };
  }

  if (sanitized.length > VALIDATION_RULES.CATEGORY_MAX) {
    return { isValid: false, error: `category name too long (max ${VALIDATION_RULES.CATEGORY_MAX})` };
  }

  if (!/^[a-zA-Z0-9\s\-_]+$/.test(sanitized)) {
    return { isValid: false, error: 'category name contains invalid characters' };
  }
  
  return { isValid: true };
}

export function validateQuestData(data: {
  title: string;
  description: string;
  categories?: string[];
}): ValidationResult & { santizedData?: typeof data } {
  const titleValidation = validateQuestTitle(data.title);
  if(!titleValidation.isValid) return titleValidation;

  if(data.categories){
    for(const category of data.categories){
      const catValidation = validateCategoryName(category);
      if(!catValidation.isValid) return catValidation;
    }
  }

  return {
    isValid: true,
    santizedData: {
      title: sanitizeText(data.title),
      description: sanitizeText(data.description),
      categories: data.categories?.map(sanitizeText)
    }
  };
}
