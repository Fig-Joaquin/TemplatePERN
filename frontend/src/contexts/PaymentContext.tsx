import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';

interface PaymentContextType {
  refreshPayments: () => void;
  paymentVersion: number;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const usePaymentContext = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePaymentContext must be used within a PaymentProvider');
  }
  return context;
};

interface PaymentProviderProps {
  children: ReactNode;
}

export const PaymentProvider: React.FC<PaymentProviderProps> = ({ children }) => {
  const [paymentVersion, setPaymentVersion] = useState(0);

  const refreshPayments = useCallback(() => {
    setPaymentVersion(prev => prev + 1);
  }, []);

  const value = useMemo(() => ({
    refreshPayments,
    paymentVersion
  }), [refreshPayments, paymentVersion]);

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};
