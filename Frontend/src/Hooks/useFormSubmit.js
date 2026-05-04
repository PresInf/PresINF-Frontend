import { useState, useCallback, useRef } from 'react';
import { useNotify } from '../context/notificationContext';
import { getErrorMessage } from '../utils/errorHandler';

/**
 * Hook para manejar envíos de formularios con control de duplicados
 * Características:
 * - Desactiva el botón durante el envío
 * - Evita múltiples envíos simultáneos
 * - Proporciona notificaciones de error automáticas
 * - Valida campos obligatorios antes de enviar
 * - Manejo seguro de respuestas
 * 
 * @param {Function} onSubmit - Función async que ejecuta el envío (debe retornar la respuesta)
 * @param {Object} options - Opciones personalizadas
 * @returns {Object} { isSubmitting, execute, reset }
 */
export const useFormSubmit = (onSubmit, options = {}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const notify = useNotify();
    const abortControllerRef = useRef(null);

    const {
        onSuccess = () => { },
        onError = () => { },
        successMessage = 'Operación completada exitosamente',
        errorPrefix = '',
        validateBefore = null, // Función de validación que retorna { isValid, message }
        showSuccessToast = true,
        showErrorToast = true,
    } = options;

    const execute = useCallback(async (formData = {}) => {
        // Prevenir múltiples envíos simultáneos
        if (isSubmitting) {
            console.warn('Formulario ya se está enviando. Intente nuevamente.');
            return null;
        }

        // Validar antes de enviar si se proporciona validador
        if (validateBefore) {
            const validation = validateBefore(formData);
            if (!validation.isValid) {
                if (showErrorToast) {
                    notify.error(`${validation.message}`);
                }
                onError(validation);
                return null;
            }
        }

        setIsSubmitting(true);
        abortControllerRef.current = new AbortController();

        try {
            const response = await onSubmit(formData, abortControllerRef.current.signal);

            // Si la llamada fue abortada, no procesar
            if (abortControllerRef.current?.signal.aborted) {
                return null;
            }

            // Mostrar notificación de éxito
            if (showSuccessToast) {
                notify.success(`${successMessage}`);
            }

            onSuccess(response);
            return response;

        } catch (error) {
            // Si fue abortada, no mostrar error
            if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
                console.info('Solicitud cancelada');
                return null;
            }

            const errorMessage = getErrorMessage(error);
            const fullMessage = errorPrefix ? `${errorPrefix}: ${errorMessage}` : errorMessage;

            if (showErrorToast) {
                notify.error(`${fullMessage}`);
            }

            onError(error);
            return null;

        } finally {
            setIsSubmitting(false);
            abortControllerRef.current = null;
        }
    }, [isSubmitting, onSubmit, notify, onSuccess, onError, successMessage, errorPrefix, showSuccessToast, showErrorToast, validateBefore]);

    const reset = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setIsSubmitting(false);
    }, []);

    return { isSubmitting, execute, reset };
};

/**
 * Hook para validar campos obligatorios
 * @param {Object} data - Datos a validar
 * @param {Array<string>} requiredFields - Campos obligatorios
 * @returns {Object} { isValid, message }
 */
export const useValidateRequired = (data, requiredFields = []) => {
    const missingFields = requiredFields.filter(field => {
        const value = data[field];
        return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
        return {
            isValid: false,
            message: `Campos obligatorios faltantes: ${missingFields.join(', ')}`,
        };
    }

    return { isValid: true, message: '' };
};
