// Funciones para traducir estados del sistema

export const translateQuotationStatus = (status: string): string => {
  const translations: Record<string, string> = {
    "approved": "Aprobada",
    "pending": "Pendiente", 
    "rejected": "Rechazada",
  };
  return translations[status] || status;
};

export const translateWorkOrderStatus = (status: string): string => {
  const translations: Record<string, string> = {
    "not_started": "No Iniciada",
    "in_progress": "En Progreso", 
    "finished": "Completada",
    "cancelled": "Cancelada"
  };
  return translations[status] || status;
};

export const getQuotationStatusVariant = (status: string): { 
  variant: 'default' | 'destructive' | 'outline' | 'secondary';
  className: string;
} => {
  switch (status) {
    case 'approved':
      return { variant: 'default', className: 'bg-green-600 text-white' };
    case 'rejected':
      return { variant: 'destructive', className: 'bg-red-600 text-white' };
    case 'pending':
      return { variant: 'outline', className: 'bg-yellow-500 text-white' };
    default:
      return { variant: 'outline', className: '' };
  }
};

export const getWorkOrderStatusVariant = (status: string): {
  variant: 'default' | 'destructive' | 'outline' | 'secondary';
  className: string;
} => {
  switch (status) {
    case 'finished':
      return { variant: 'default', className: 'bg-green-600 text-white' };
    case 'in_progress':
      return { variant: 'secondary', className: 'bg-blue-600 text-white' };
    case 'not_started':
      return { variant: 'outline', className: 'bg-gray-500 text-white' };
    case 'cancelled':
      return { variant: 'destructive', className: 'bg-red-600 text-white' };
    default:
      return { variant: 'outline', className: '' };
  }
};
