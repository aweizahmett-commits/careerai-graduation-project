import { useState, useCallback, useEffect } from 'react'
import { ValidationUtils } from '../utils/validation'
import type { FormField, FormState, ValidationRule } from '../types'

/**
 * A custom hook for managing form state and validation
 * @param fields Form field definitions
 * @param initialValues Initial form values
 * @param onSubmit Submit handler
 * @returns Form state and handlers
 */
export function useForm<T extends Record<string, any>>(
  fields: FormField[],
  initialValues: Partial<T> = {},
  onSubmit?: (values: T) => Promise<void> | void
) {
  const [values, setValues] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {}
    fields.forEach(field => {
      initial[field.name] = initialValues[field.name as keyof T] || ''
    })
    return initial
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isValid, setIsValid] = useState(true)

  // Validation function
  const validateField = useCallback((field: FormField, value: any): string | null => {
    if (!field.validation) return null

    for (const rule of field.validation) {
      switch (rule.type) {
        case 'required':
          if (!ValidationUtils.validateRequired(value)) {
            return rule.message
          }
          break
        case 'email':
          if (value && !ValidationUtils.validateEmail(value)) {
            return rule.message
          }
          break
        case 'minLength':
          if (value && !ValidationUtils.validateMinLength(value, rule.value)) {
            return rule.message
          }
          break
        case 'maxLength':
          if (value && !ValidationUtils.validateMaxLength(value, rule.value)) {
            return rule.message
          }
          break
        case 'pattern':
          if (value && !new RegExp(rule.value).test(value)) {
            return rule.message
          }
          break
        case 'custom':
          if (rule.value && !rule.value(value)) {
            return rule.message
          }
          break
      }
    }

    return null
  }, [])

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}
    let isFormValid = true

    fields.forEach(field => {
      const error = validateField(field, values[field.name])
      if (error) {
        newErrors[field.name] = error
        isFormValid = false
      }
    })

    setErrors(newErrors)
    setIsValid(isFormValid)
    return isFormValid
  }, [fields, values, validateField])

  // Handle field value change
  const handleChange = useCallback((fieldName: string, value: any) => {
    setValues(prev => ({ ...prev, [fieldName]: value }))
    
    // Validate field if it has been touched
    if (touched[fieldName]) {
      const field = fields.find(f => f.name === fieldName)
      if (field) {
        const error = validateField(field, value)
        setErrors(prev => ({ ...prev, [fieldName]: error || '' }))
      }
    }
  }, [fields, touched, validateField])

  // Handle field blur
  const handleBlur = useCallback((fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }))
    
    const field = fields.find(f => f.name === fieldName)
    if (field) {
      const error = validateField(field, values[fieldName])
      setErrors(prev => ({ ...prev, [fieldName]: error || '' }))
    }
  }, [fields, values, validateField])

  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {}
    fields.forEach(field => {
      allTouched[field.name] = true
    })
    setTouched(allTouched)

    // Validate form
    if (!validateForm()) {
      return
    }

    if (onSubmit) {
      try {
        setIsSubmitting(true)
        await onSubmit(values as T)
      } catch (error) {
        console.error('Form submission error:', error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }, [fields, validateForm, onSubmit, values])

  // Reset form
  const resetForm = useCallback(() => {
    const resetValues: Record<string, any> = {}
    fields.forEach(field => {
      resetValues[field.name] = initialValues[field.name as keyof T] || ''
    })
    setValues(resetValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
    setIsValid(true)
  }, [fields, initialValues])

  // Set field value programmatically
  const setFieldValue = useCallback((fieldName: string, value: any) => {
    setValues(prev => ({ ...prev, [fieldName]: value }))
  }, [])

  // Set field error programmatically
  const setFieldError = useCallback((fieldName: string, error: string) => {
    setErrors(prev => ({ ...prev, [fieldName]: error }))
  }, [])

  // Clear field error
  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => ({ ...prev, [fieldName]: '' }))
  }, [])

  // Get field props for a specific field
  const getFieldProps = useCallback((fieldName: string) => {
    const field = fields.find(f => f.name === fieldName)
    return {
      name: fieldName,
      value: values[fieldName] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        handleChange(fieldName, e.target.value)
      },
      onBlur: () => handleBlur(fieldName),
      error: errors[fieldName],
      touched: touched[fieldName],
      required: field?.required,
      disabled: field?.disabled,
      placeholder: field?.placeholder,
      type: field?.type,
    }
  }, [fields, values, errors, touched, handleChange, handleBlur])

  // Update validation when values change
  useEffect(() => {
    if (Object.keys(touched).some(key => touched[key])) {
      validateForm()
    }
  }, [values, touched, validateForm])

  const formState: FormState = {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
  }

  return {
    formState,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
    setFieldError,
    clearFieldError,
    getFieldProps,
    validateForm,
  }
}
