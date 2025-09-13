import { useCallback, useState } from "react";
import "./WebAuthnLogin.css";
import {
  generateAuthenticationOptions,
  GenerateAuthenticationOptionsOpts,
  VerifiedAuthenticationResponse,
  verifyAuthenticationResponse,
  VerifyAuthenticationResponseOpts,
} from "@simplewebauthn/server";
import ReactJsonView from "@microlink/react-json-view";
import { startAuthentication } from "@simplewebauthn/browser";
import { useUserContext } from "../../context/UserContext";
import React from "react";
import Header from "../../component/Header";

const RP_ID = "localhost";
const expectedOrigin = "http://localhost:5173";

export default function WebAuthnLogin() {
  const { users, setUsers } = useUserContext();
  const [username, setUsername] = useState("");
  const [loginOptions, setLoginOptions] = useState<any>();
  const [authenticatorResponse, setAuthenticatorResponse] = useState<any>();

  const createLoginOptions = useCallback(async () => {
    if (!username.length) {
      return;
    }
    const user = users.find((u) => u.username === username);

    if (user) {
      const opts: GenerateAuthenticationOptionsOpts = {
        timeout: 60000,
        allowCredentials: user.credentials.map((cred) => ({
          id: cred.id,
          type: "public-key",
          transports: cred.transports,
        })),
        userVerification: "preferred",
        rpID: RP_ID,
      };

      const options = await generateAuthenticationOptions(opts);
      setLoginOptions(options as any);
    }
  }, [username, users, setLoginOptions]);

  const createloginResponse = useCallback(async () => {
    if (!loginOptions) {
      return;
    }
    const assertionResp = await startAuthentication(loginOptions);
    setAuthenticatorResponse(assertionResp);
  }, [loginOptions, setAuthenticatorResponse]);

  const verifyResponse = useCallback(async () => {
    const user = users.find((u) => u.username === username);

    if (!user) {
      console.error("User not found");
      return;
    }

    const dbCredential = user.credentials.find(
      (cred) => cred.id === authenticatorResponse.id
    );

    if (!dbCredential) {
      console.error("No matching credential found");
      return;
    }

    let verification: VerifiedAuthenticationResponse;
    try {
      const opts: VerifyAuthenticationResponseOpts = {
        response: authenticatorResponse,
        expectedChallenge: loginOptions.challenge,
        expectedOrigin,
        expectedRPID: RP_ID,
        credential: dbCredential,
        requireUserVerification: false,
      };
      verification = await verifyAuthenticationResponse(opts);
    } catch (error) {
      const _error = error as Error;
      console.error("Registration verification failed:", _error);
      return;
    }

    const { verified, authenticationInfo } = verification;

    if (verified && authenticationInfo) {
      const { newCounter } = authenticationInfo;

      setUsers((prevUsers) => {
        const userIndex = prevUsers.findIndex((u) => u.username === username);
        const credentialIndex = prevUsers[userIndex].credentials.findIndex(
          (cred) => cred.id === dbCredential.id
        );
        if (userIndex !== -1 && credentialIndex !== -1) {
          const updatedUsers = [...prevUsers];
          const updatedCredential = [...updatedUsers[userIndex].credentials];
          updatedCredential[credentialIndex] = {
            ...updatedCredential[credentialIndex],
            counter: newCounter,
          };
          updatedUsers[userIndex] = {
            ...updatedUsers[userIndex],
            credentials: updatedCredential,
          };
          return updatedUsers;
        }
        return prevUsers;
      });
    }
  }, [username, users, authenticatorResponse, loginOptions, setUsers]);

  return (
    <>
      <Header />
      <div>
        <ReactJsonView src={users} style={{ background: "white" }} />
        <div style={{ display: "flex", flexDirection: "row" }}>
          <div
            style={{
              flexBasis: "50%",
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <h2>Frontend</h2>
            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "center",
              }}
            >
              Username
              <input
                className="name-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Type text here"
              />
              <button onClick={createLoginOptions}>Create Login Options</button>
            </div>
            <button
              onClick={createloginResponse}
              style={{ width: "fit-content" }}
            >
              Start Registration
            </button>
            <ReactJsonView
              src={authenticatorResponse}
              style={{ background: "white" }}
            />
            <button onClick={verifyResponse} style={{ width: "fit-content" }}>
              Verify
            </button>
          </div>
          <div style={{ flexBasis: "50%" }}>
            <h2>Backend</h2>
            <ReactJsonView src={loginOptions} style={{ background: "white" }} />
          </div>
        </div>
      </div>
    </>
  );
}
