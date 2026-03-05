/**
 * Extrae el mensaje de error desde diferentes fuentes
 * Prioriza mensajes específicos del servidor sobre genéricos
 */
export const getErrorMessage = (error) => {
  // Si es error de axios con respuesta del backend
  if (error?.response?.data) {
    const { message, error: errorMsg } = error.response.data;
    
    // Si el backend envía un mensaje estructurado
    if (message && typeof message === 'string') {
      return message;
    }
    if (errorMsg && typeof errorMsg === 'string') {
      return errorMsg;
    }
  }

  // Mensajes específicos por HTTP status
  const status = error?.response?.status;
  const statusMessages = {
    400: 'Datos inválidos. Verifica los campos.',
    401: 'Tu sesión expiró. Inicia sesión de nuevo.',
    403: 'No tienes permisos para hacer esto.',
    404: 'El recurso solicitado no existe.',
    409: 'Este elemento ya existe.',
    422: 'Los datos enviados no son válidos.',
    500: 'Error en el servidor. Intenta más tarde.',
    503: 'El servidor no está disponible. Intenta más tarde.',
  };

  if (statusMessages[status]) {
    return statusMessages[status];
  }

  // Fallback a mensaje de error genérico
  return error?.message || 'Error desconocido. Intenta de nuevo.';
};