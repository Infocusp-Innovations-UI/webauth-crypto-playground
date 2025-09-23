import React, { createContext, ReactNode } from "react";

interface WebAuthnRegistrationContextType {
  username: string;
  setUsername: (v: string) => void;
  rpName: string;
  setRpName: (v: string) => void;
  registrationOptions: any;
  setRegistrationOptions: (v: any) => void;
  authenticatorResponse: any;
  setAuthenticatorResponse: (v: any) => void;
  verificationResult: any;
  setVerificationResult: (v: any) => void;
}

const WebAuthnRegistrationContext =
  React.createContext<WebAuthnRegistrationContextType>({
    username: "",
    setUsername: (v: string) => {},
    rpName: "",
    setRpName: (v: string) => {},
    registrationOptions: null,
    setRegistrationOptions: (v: any) => {},
    authenticatorResponse: null,
    setAuthenticatorResponse: (v: any) => {},
    verificationResult: null,
    setVerificationResult: (v: any) => {},
  });

export const WebAuthnRegistrationProvider = ({
  children,
  value,
}: {
  children: ReactNode;
  value: WebAuthnRegistrationContextType;
}) => {
  return (
    <WebAuthnRegistrationContext.Provider value={value}>
      {children}
    </WebAuthnRegistrationContext.Provider>
  );
};

export const useWebAuthnRegistrationContext = () => {
  const context = React.useContext(WebAuthnRegistrationContext);
  if (!context) {
    throw new Error(
      "useWebAuthnRegistrationContext must be used within a WebAuthnRegistrationProvider"
    );
  }
  return context;
};

export default WebAuthnRegistrationContext;
