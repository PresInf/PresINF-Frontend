/**
 * Extrae el mensaje de error desde diferentes fuentes
 * Prioriza mensajes específicos del servidor sobre genéricos
 * Cubre validaciones de campos, duplicados, errores de red, etc.
 */
export const getErrorMessage = (error) => {
  // Si es error de axios con respuesta del backend
  if (error?.response?.data) {
    const { message, error: errorMsg, errors } = error.response.data;
    
    // Si hay un array de errores de validación (ej: class-validator)
    if (Array.isArray(errors) && errors.length > 0) {
      const messages = errors
        .map(e => e.message || e.constraints?.[Object.keys(e.constraints || {})[0]] || String(e))
        .filter(Boolean);
      if (messages.length > 0) {
        return messages.join('. ');
      }
    }
    
    // Si el backend envía un mensaje estructurado
    if (message && typeof message === 'string') {
      return message;
    }
    if (errorMsg && typeof errorMsg === 'string') {
      return errorMsg;
    }
  }

  // Errores específicos por HTTP status
  const status = error?.response?.status;
  const statusMessages = {
    400: 'Los datos enviados no son válidos. Verifica los campos obligatorios.',
    401: 'Tu sesión expiró. Por favor, inicia sesión de nuevo.',
    403: 'No tienes permisos para realizar esta acción.',
    404: 'El recurso solicitado no existe o fue eliminado.',
    409: 'Este registro ya existe en el sistema. Verifica que no esté duplicado.',
    410: 'Este recurso ya no está disponible.',
    413: 'El archivo es demasiado grande. Intenta con uno más pequeño.',
    415: 'Formato de datos no soportado.',
    422: 'Los datos enviados no son válidos. Verifica todos los campos.',
    429: 'Demasiadas solicitudes. Intenta de nuevo en unos momentos.',
    500: 'Error en el servidor. Intenta más tarde.',
    502: 'El servidor no está respondiendo correctamente. Intenta de nuevo.',
    503: 'El servidor no está disponible. Intenta de nuevo más tarde.',
    504: 'Tiempo de espera agotado. La operación tardó demasiado.',
  };

  if (statusMessages[status]) {
    return statusMessages[status];
  }

  // Errores de conexión
  if (error?.code === 'ECONNABORTED') {
    return 'La solicitud tardó demasiado tiempo. Verifica tu conexión de internet.';
  }
  if (error?.code === 'ECONNREFUSED' || error?.code === 'ERR_NETWORK') {
    return 'No se pudo conectar al servidor. Verifica tu conexión de internet.';
  }
  if (error?.code === 'ETIMEDOUT') {
    return 'Tiempo de conexión agotado. El servidor tardó demasiado en responder.';
  }

  // Errores genéricos
  if (error?.message === 'Network Error') {
    return 'Error de conexión. Verifica tu conexión de internet.';
  }

  // Fallback a mensaje de error genérico
  return error?.message || 'Error desconocido. Intenta de nuevo.';
};

/**
 * Valida un campo obligatorio
 * @param {any} value - El valor a validar
 * @param {string} fieldName - Nombre del campo para el mensaje
 * @returns {Object} { isValid, message }
 */
export const validateRequired = (value, fieldName) => {
  if (value === undefined || value === null || value === '' || (typeof value === 'string' && value.trim() === '')) {
    return {
      isValid: false,
      message: `${fieldName} es obligatorio`,
    };
  }
  return { isValid: true, message: '' };
};

/**
 * Valida formato de email
 * @param {string} email - Email a validar
 * @returns {Object} { isValid, message }
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      message: 'El correo electrónico no es válido',
    };
  }
  return { isValid: true, message: '' };
};

/**
 * Valida formato de DNI (número de 6-10 dígitos)
 * @param {string} dni - DNI a validar
 * @returns {Object} { isValid, message }
 */
export const validateDNI = (dni) => {
  if (!/^\d{6,10}$/.test(dni)) {
    return {
      isValid: false,
      message: 'El DNI debe tener entre 6 y 10 dígitos',
    };
  }
  return { isValid: true, message: '' };
};

/**
 * Valida formato de fecha (YYYY-MM-DD)
 * @param {string} fecha - Fecha a validar
 * @returns {Object} { isValid, message }
 */
export const validateDate = (fecha) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(fecha)) {
    return {
      isValid: false,
      message: 'La fecha debe tener formato YYYY-MM-DD',
    };
  }
  
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) {
    return {
      isValid: false,
      message: 'La fecha no es válida',
    };
  }

  return { isValid: true, message: '' };
};

/**
 * Valida múltiples campos a la vez
 * @param {Object} data - Objeto con datos a validar
 * @param {Array} validations - Array de validaciones { field, validator, message? }
 * @returns {Object} { isValid, errors }
 */
export const validateMultiple = (data, validations = []) => {
  const errors = [];
  
  for (const { field, validator, message } of validations) {
    const result = validator(data[field]);
    if (!result.isValid) {
      errors.push({
        field,
        message: message || result.message,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};