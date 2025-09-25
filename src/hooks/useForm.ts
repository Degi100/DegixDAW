// src/hooks/useForm.ts
import { useState, useCallback } from 'react';
import type { z } from 'zod';
import { validateForm } from '../lib/validation';

interface UseFormOptions<T> {
  schema: z.ZodSchema<T>;
  initialValues: T;
  onSubmit: (data: T) => Promise<void> | void;
}

export function useForm<T extends Record<string, string>>({ 
  schema, 
  initialValues, 
  onSubmit 
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback((field: keyof T, value: string) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  }, [errors]);

  const validate = useCallback(() => {
    const result = validateForm(schema, values);
    setErrors(result.errors);
    return result.success;
  }, [schema, values]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    const isValid = validate();
    
    if (isValid && values) {
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      }
    }
    
    setIsSubmitting(false);
  }, [isSubmitting, validate, values, onSubmit]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsSubmitting(false);
  }, [initialValues]);

  const getFieldProps = useCallback((field: keyof T) => ({
    value: values[field] || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setValue(field, e.target.value),
    error: errors[field as string],
  }), [values, errors, setValue]);

  return {
    values,
    errors,
    isSubmitting,
    setValue,
    handleSubmit,
    reset,
    getFieldProps,
    hasErrors: Object.keys(errors).length > 0,
    isValid: Object.keys(errors).length === 0,
  };
}