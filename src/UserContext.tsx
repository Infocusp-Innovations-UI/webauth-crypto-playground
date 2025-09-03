import { WebAuthnCredential } from "@simplewebauthn/types";
import React, { createContext, useState, ReactNode, useContext } from "react";

export interface LoggedInUser {
  id: string;
  username: string;
  credentials: WebAuthnCredential[];
}

interface UserContextType {
  users: LoggedInUser[];
  setUsers: React.Dispatch<React.SetStateAction<LoggedInUser[]>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<LoggedInUser[]>([]);

  return (
    <UserContext.Provider value={{ users, setUsers }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};
