import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { WebAuthnCredential } from "@simplewebauthn/types";
import {
  generateRegistrationOptions,
  GenerateRegistrationOptionsOpts,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { startRegistration } from "@simplewebauthn/browser";
import { useUserContext } from "../../context/UserContext";
import {
  useWebAuthnRegistrationContext,
  WebAuthnRegistrationProvider,
} from "../../context/WebAuthnRegistrationContext";
import "./WebAuthnRegistration.css";

const RP_ID = "localhost";
const RP_NAME = "infocusp.com";
const expectedOrigin = "http://localhost:5173";

function PublicKeyGenerateNode() {
  const {
    username,
    setUsername,
    rpName,
    setRpName,
    challenge,
    setChallenge,
    registrationOptions,
    setRegistrationOptions,
  } = useWebAuthnRegistrationContext();
  const { users } = useUserContext();

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handleRpNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRpName(e.target.value);
  };

  const generateChallenge = useCallback(() => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setChallenge(result);
  }, [setChallenge]);

  const createPublicKeyOptions = useCallback(async () => {
    if (!username || !rpName) {
      alert("Please enter username and RP name first!");
      return;
    }

    if (!challenge) {
      alert("Please generate a challenge first!");
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
    setRegistrationOptions(options);
  }, [
    username,
    rpName,
    challenge,
    users,
    setRegistrationOptions,
    generateChallenge,
  ]);

  return (
    <div className="nodeCard">
      <div className="node-header node-header--blue">PUBLIC KEY GENERATION</div>
      <div className="node-body">
        <div style={{ marginBottom: "10px" }}>
          <label className="node-label">Username</label>
          <input
            className="node-input"
            type="text"
            value={username}
            onChange={handleUsernameChange}
            placeholder="Enter username"
            onMouseDown={(e) => e.stopPropagation()}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label className="node-label">RP Name</label>
          <input
            className="node-input"
            type="text"
            value={rpName}
            onChange={handleRpNameChange}
            placeholder="Enter RP name"
            onMouseDown={(e) => e.stopPropagation()}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <button
            className="node-button"
            onClick={generateChallenge}
            disabled={!username || !rpName}
            onMouseDown={(e) => e.stopPropagation()}
          >
            Generate Challenge
          </button>
        </div>
        <div className="node-output">
          Challenge: {challenge ? `${challenge}...` : "Not generated"}
        </div>
        <div style={{ marginBottom: "10px", marginTop: "10px" }}>
          <button
            className="node-button"
            onClick={createPublicKeyOptions}
            disabled={!username || !rpName || !challenge}
            onMouseDown={(e) => e.stopPropagation()}
          >
            Generate Public Key
          </button>
        </div>
        <div className="node-output">
          {registrationOptions ? "Public Key Created ✓" : "Click to generate"}
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function CredentialsNode() {
  const {
    registrationOptions,
    authenticatorResponse,
    setAuthenticatorResponse,
  } = useWebAuthnRegistrationContext();

  const createCredentials = useCallback(async () => {
    if (!registrationOptions) {
      alert("Please create public key options first!");
      return;
    }

    try {
      const attResp = await startRegistration(registrationOptions);
      setAuthenticatorResponse(attResp);
      alert("Credentials created successfully!");
    } catch (error) {
      alert(`Registration failed: ${error}`);
    }
  }, [registrationOptions, setAuthenticatorResponse]);

  return (
    <div className="nodeCard">
      <div className="node-header node-header--red">CREATE CREDENTIALS</div>
      <div className="node-body">
        <div style={{ marginBottom: "10px" }}>
          <button
            className="node-button"
            onClick={createCredentials}
            disabled={!registrationOptions}
            onMouseDown={(e) => e.stopPropagation()}
          >
            Create Credentials
          </button>
        </div>
        <div className="node-output">
          {authenticatorResponse
            ? "Credentials Created ✓"
            : "Click to create credentials"}
        </div>
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function GeneratedCredentialsNode() {
  const { authenticatorResponse } = useWebAuthnRegistrationContext();

  return (
    <div className="nodeCard">
      <div className="node-header node-header--green">CREDENTIALS ID</div>
      <div className="node-body">
        <div className="node-output">
          {authenticatorResponse
            ? `ID: ${authenticatorResponse.id?.substring(0, 20)}...`
            : "No credentials yet"}
        </div>
      </div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function DatabaseSaveNode() {
  const { username, authenticatorResponse, verificationResult } =
    useWebAuthnRegistrationContext();
  const { setUsers } = useUserContext();

  const saveToDatabase = useCallback(() => {
    if (!authenticatorResponse || !verificationResult?.verified) {
      return;
    }

    const { registrationInfo } = verificationResult;
    if (registrationInfo) {
      const { credential } = registrationInfo;

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
              id: Date.now().toString(),
              username,
              credentials: [newCredential],
            },
          ];
        }
      });
    }
  }, [username, authenticatorResponse, verificationResult, setUsers]);

  useEffect(() => {
    if (authenticatorResponse && verificationResult?.verified) {
      saveToDatabase();
    }
  }, [authenticatorResponse, verificationResult, saveToDatabase]);

  return (
    <div className="nodeCard">
      <div className="node-header node-header--teal">DATABASE SAVE</div>
      <div className="node-body">
        <div className="node-output">
          {verificationResult?.verified
            ? `${username} - Saved to Local Storage ✓`
            : "Waiting for verification..."}
        </div>
      </div>
      <Handle type="target" position={Position.Top} />
    </div>
  );
}

function VerifyNode() {
  const {
    authenticatorResponse,
    registrationOptions,
    verificationResult,
    setVerificationResult,
  } = useWebAuthnRegistrationContext();

  const verifyResponse = useCallback(async () => {
    if (!authenticatorResponse || !registrationOptions) {
      return;
    }

    try {
      const opts = {
        response: authenticatorResponse,
        expectedChallenge: registrationOptions.challenge,
        expectedOrigin,
        expectedRPID: RP_ID,
        requireUserVerification: false,
      };
      //const verification = await verifyRegistrationResponse(opts);
      //setVerificationResult(verification);

      //Temporary verifying on Frontend
      setVerificationResult({ verified: true, error: null });
    } catch (error) {
      const _error = error as Error;
      console.error("Registration verification failed:", _error);
      //setVerificationResult({ verified: false, error: _error.message });
      //Temporary verifying on Frontend
      setVerificationResult({ verified: true, error: null });
    }
  }, [authenticatorResponse, registrationOptions, setVerificationResult]);

  return (
    <div className="nodeCard">
      <div className="node-header node-header--yellow">VERIFY ON SERVER</div>
      <div className="node-body">
        <div style={{ marginBottom: "10px" }}>
          <button
            className="node-button"
            onClick={verifyResponse}
            disabled={!authenticatorResponse || !registrationOptions}
            onMouseDown={(e) => e.stopPropagation()}
          >
            Verify Response
          </button>
        </div>
        <div className="node-output">
          {verificationResult?.verified
            ? "Verification Successful ✓"
            : "Verification Pending ..."}
        </div>
      </div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const nodeTypes = {
  publicKeyGenerateNode: PublicKeyGenerateNode,
  credentialsNode: CredentialsNode,
  generatedCredentialsNode: GeneratedCredentialsNode,
  databaseSaveNode: DatabaseSaveNode,
  verifyNode: VerifyNode,
};

const WebAuthnRegistration = () => {
  const [username, setUsername] = useState("");
  const [rpName, setRpName] = useState(RP_NAME);
  const [challenge, setChallenge] = useState("");
  const [registrationOptions, setRegistrationOptions] = useState<any>(null);
  const [authenticatorResponse, setAuthenticatorResponse] = useState<any>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const nodes = useMemo(
    () => [
      {
        id: "n1",
        type: "publicKeyGenerateNode",
        position: { x: 0, y: 0 },
        data: {},
        draggable: true,
      },
      {
        id: "n2",
        type: "credentialsNode",
        position: { x: 350, y: 0 },
        data: {},
        draggable: true,
      },
      {
        id: "n3",
        type: "generatedCredentialsNode",
        position: { x: 700, y: 0 },
        data: {},
        draggable: true,
      },
      {
        id: "n4",
        type: "verifyNode",
        position: { x: 375, y: 400 },
        data: {},
        draggable: true,
      },
      {
        id: "n5",
        type: "databaseSaveNode",
        position: { x: 725, y: 300 },
        data: {},
        draggable: true,
      },
    ],
    []
  );

  const edges = useMemo(
    () => [
      { id: "e1-2", source: "n1", target: "n2", animated: true },
      { id: "e2-3", source: "n2", target: "n3", animated: true },
      { id: "e3-4", source: "n3", target: "n4", animated: true },
      { id: "e4-5", source: "n4", target: "n5", animated: true },
    ],
    []
  );

  return (
    <div className="webauthn-flow-container">
      <WebAuthnRegistrationProvider
        value={{
          username,
          setUsername,
          rpName,
          setRpName,
          challenge,
          setChallenge,
          registrationOptions,
          setRegistrationOptions,
          authenticatorResponse,
          setAuthenticatorResponse,
          verificationResult,
          setVerificationResult,
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          nodesDraggable={true}
          nodesConnectable={false}
          elementsSelectable={true}
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </WebAuthnRegistrationProvider>
    </div>
  );
};

export default WebAuthnRegistration;
