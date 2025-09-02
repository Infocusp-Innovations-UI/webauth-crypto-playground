import { useCallback, useState } from "react";
import "./simplewebauthn.css";
import { WebAuthnCredential } from "@simplewebauthn/types";
import {
  generateRegistrationOptions,
  GenerateRegistrationOptionsOpts,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import ReactJsonView from "@microlink/react-json-view";
import { startRegistration } from "@simplewebauthn/browser";
import { useUserContext } from "./UserContext";

const RP_ID = "localhost";
const RP_NAME = "SimpleWebAuthn Example";
const expectedOrigin = "http://localhost:5173";

export default function WebAuthnRegistration() {
  const { users, setUsers } = useUserContext();
  const [username, setUsername] = useState("");
  const [registrationOptions, setRegistrationOptions] = useState<any>();
  const [authenticatorResponse, setAuthenticatorResponse] = useState<any>();

  const createRegistrationOptions = useCallback(async () => {
    if (!username.length) {
      return;
    }
    const user = users.find((u) => u.username === username);
    const credentials = user ? user.credentials : [];

    const opts: GenerateRegistrationOptionsOpts = {
      rpName: RP_NAME,
      rpID: RP_ID,
      userName: username,
      timeout: 60000,
      attestationType: "none",
      excludeCredentials: credentials.map((cred) => ({
        id: cred.id,
        type: "public-key",
        transports: cred.transports,
      })),
      authenticatorSelection: {
        residentKey: "discouraged",
        userVerification: "preferred",
      },
      supportedAlgorithmIDs: [-7, -257],
    };

    const options = await generateRegistrationOptions(opts);
    setRegistrationOptions(options as any);
  }, [username, users, setRegistrationOptions]);

  const createAuthenticatorResponse = useCallback(async () => {
    if (!registrationOptions) {
      return;
    }
    const attResp = await startRegistration(registrationOptions);
    setAuthenticatorResponse(attResp);
  }, [registrationOptions, setAuthenticatorResponse]);

  const verifyResponse = useCallback(async () => {
    const user = users.find((u) => u.username === username);

    let verification;
    try {
      const opts = {
        response: authenticatorResponse,
        expectedChallenge: registrationOptions.challenge,
        expectedOrigin,
        expectedRPID: RP_ID,
        requireUserVerification: false,
      };
      verification = await verifyRegistrationResponse(opts);
    } catch (error) {
      const _error = error as Error;
      console.error("Registration verification failed:", _error);
    }

    const { verified, registrationInfo } = verification;

    if (verified && registrationInfo) {
      const { credential } = registrationInfo;

      const credentials = user ? user.credentials : [];

      const existingCredential = credentials.find(
        (cred) => cred.id === credential.id
      );

      if (!existingCredential) {
        const newCredential: WebAuthnCredential = {
          id: credential.id,
          publicKey: credential.publicKey,
          counter: credential.counter,
        };

        setUsers((prevUsers) => {
          const userIndex = prevUsers.findIndex((u) => u.username === username);
          if (userIndex !== -1) {
            const updatedUsers = [...prevUsers];
            updatedUsers[userIndex] = {
              ...updatedUsers[userIndex],
              credentials: [
                ...updatedUsers[userIndex].credentials,
                newCredential,
              ],
            };
            return updatedUsers;
          } else {
            return [
              ...prevUsers,
              {
                id: registrationOptions.challenge,
                username,
                credentials: [newCredential],
              },
            ];
          }
        });
      }
    }
  }, [username, users, authenticatorResponse, registrationOptions, setUsers]);

  return (
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
            <button onClick={createRegistrationOptions}>Create Options</button>
          </div>
          <button
            onClick={createAuthenticatorResponse}
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
          <ReactJsonView
            src={registrationOptions}
            style={{ background: "white" }}
          />
        </div>
      </div>
    </div>
  );
}
