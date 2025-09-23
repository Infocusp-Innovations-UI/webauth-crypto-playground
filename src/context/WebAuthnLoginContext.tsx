import React, { createContext, useContext } from "react";

type WebAuthnLoginContextType = {
  username: string;
  setUsername: React.Dispatch<React.SetStateAction<string>>;

  authOptions: any;
  setAuthOptions: React.Dispatch<React.SetStateAction<any>>;

  authResponse: any;
  setAuthResponse: React.Dispatch<React.SetStateAction<any>>;

  verificationResult: any;
  setVerificationResult: React.Dispatch<React.SetStateAction<any>>;
};

const WebAuthnLoginContext = createContext<WebAuthnLoginContextType | undefined>(
  undefined
);

export const WebAuthnLoginProvider = ({
  value,
  children,
}: {
  value: WebAuthnLoginContextType;
  children: React.ReactNode;
}) => {
  return (
    <WebAuthnLoginContext.Provider value={value}>
      {children}
    </WebAuthnLoginContext.Provider>
  );
};

export const useWebAuthnLoginContext = () => {
  const context = useContext(WebAuthnLoginContext);
  if (!context) {
    throw new Error(
      "useWebAuthnLoginContext must be used within a WebAuthnLoginProvider"
    );
  }
  return context;
};
