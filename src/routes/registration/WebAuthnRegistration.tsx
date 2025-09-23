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
import Header from "../../component/Header";

const RP_ID = "localhost";
const RP_NAME = "infocusp.com";
const expectedOrigin = "http://localhost:5173";

function ObjectHover({
  object,
  title,
  isVisible,
}: {
  object: any;
  title: string;
  isVisible: boolean;
}) {
  if (!isVisible || !object) return null;

  return (
    <div className="object-hover">
      <div className="object-hover-content">
        <h4>{title}</h4>
        <pre>{JSON.stringify(object, null, 2)}</pre>
      </div>
    </div>
  );
}

function UserInputNode() {
  const { username, setUsername, rpName, setRpName } =
    useWebAuthnRegistrationContext();
  const [showHover, setShowHover] = useState(false);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handleRpNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRpName(e.target.value);
  };

  const userInputObject = username && rpName ? { username, rpName } : null;

  return (
    <div
      className="nodeCard node-with-hover"
      onMouseEnter={() => setShowHover(true)}
      onMouseLeave={() => setShowHover(false)}
    >
      <div className="node-header node-header--purple">
        PUBLIC KEY INPUT (CLIENT)
      </div>
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
        <div className="node-output">
          Status: {username && rpName ? "Ready ✓" : "Enter details"}
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
      <ObjectHover
        object={userInputObject}
        title="User Input Object"
        isVisible={showHover}
      />
    </div>
  );
}

function PublicKeyGenerateNode() {
  const { username, rpName, registrationOptions, setRegistrationOptions } =
    useWebAuthnRegistrationContext();
  const { users } = useUserContext();
  const [showHover, setShowHover] = useState(false);

  const createPublicKeyOptions = useCallback(async () => {
    if (!username || !rpName) {
      alert("Please enter username and RP name first!");
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
  }, [username, rpName, users, setRegistrationOptions]);

  return (
    <div
      className="nodeCard node-with-hover"
      onMouseEnter={() => setShowHover(true)}
      onMouseLeave={() => setShowHover(false)}
    >
      <div className="node-header node-header--yellow">
        PUBLIC KEY GENERATION (SERVER)
      </div>
      <div className="node-body">
        <div style={{ marginBottom: "10px" }}>
          <button
            className="node-button"
            onClick={createPublicKeyOptions}
            disabled={!username || !rpName}
            onMouseDown={(e) => e.stopPropagation()}
          >
            Generate Public Key
          </button>
        </div>
        <div className="node-output">
          {registrationOptions ? "Public Key Created ✓" : "Click to generate"}
        </div>
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <ObjectHover
        object={registrationOptions}
        title="Registration Options Object"
        isVisible={showHover}
      />
    </div>
  );
}

function CredentialsNode() {
  const {
    registrationOptions,
    authenticatorResponse,
    setAuthenticatorResponse,
  } = useWebAuthnRegistrationContext();
  const [showHover, setShowHover] = useState(false);

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
    <div
      className="nodeCard node-with-hover"
      onMouseEnter={() => setShowHover(true)}
      onMouseLeave={() => setShowHover(false)}
    >
      <div className="node-header node-header--purple">
        CREATE CREDENTIALS (CLIENT)
      </div>
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
      <ObjectHover
        object={authenticatorResponse}
        title="Authenticator Response Object"
        isVisible={showHover}
      />
    </div>
  );
}

function GeneratedCredentialsNode() {
  const { authenticatorResponse } = useWebAuthnRegistrationContext();

  return (
    <div className="nodeCard">
      <div className="node-header node-header--purple">
        CREDENTIALS ID (CLIENT)
      </div>
      <div className="node-body">
        <div className="node-output">
          {authenticatorResponse
            ? `ID: ${authenticatorResponse.id?.substring(0, 20)}... ✓`
            : "No credentials yet"}
        </div>
      </div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function DatabaseSaveNode() {
  const { username, verificationResult } = useWebAuthnRegistrationContext();
  const { users } = useUserContext();
  const [showHover, setShowHover] = useState(false);

  return (
    <div
      className="nodeCard node-with-hover"
      onMouseEnter={() => setShowHover(true)}
      onMouseLeave={() => setShowHover(false)}
    >
      <div className="node-header node-header--yellow">DATABASE (SERVER)</div>
      <div className="node-body">
        <div className="node-output">
          {verificationResult?.verified
            ? `${username} - Saved to Local Storage ✓`
            : "Waiting for verification..."}
        </div>
        <div
          className="node-output"
          style={{ marginTop: "5px", fontSize: "0.9em", color: "#666" }}
        >
          Total Users: {users.length}
        </div>
      </div>
      <Handle type="target" position={Position.Top} />
      <ObjectHover
        object={users}
        title="Users Database"
        isVisible={showHover}
      />
    </div>
  );
}

function VerifyNode() {
  const {
    username,
    authenticatorResponse,
    registrationOptions,
    verificationResult,
    setVerificationResult,
  } = useWebAuthnRegistrationContext();
  const { setUsers } = useUserContext();
  const [showHover, setShowHover] = useState(false);

  const saveUserToDatabase = useCallback(
    (verification: any) => {
      if (!verification?.verified || !username) {
        return;
      }

      setUsers((prevUsers) => {
        const userExists = prevUsers.some((u) => u.username === username);
        if (!userExists) {
          return [
            ...prevUsers,
            {
              id: Date.now().toString(),
              username,
              credentials: [],
            },
          ];
        }
        return prevUsers;
      });
    },
    [username, setUsers]
  );

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
      const verification = await verifyRegistrationResponse(opts);
      console.log(verification);
      setVerificationResult(verification);

      if (verification.verified) {
        saveUserToDatabase(verification);
      }
    } catch (error) {
      const _error = error as Error;
      console.error("Registration verification failed:", _error);
      setVerificationResult({ verified: false, error: _error.message });
    }
  }, [
    authenticatorResponse,
    registrationOptions,
    setVerificationResult,
    saveUserToDatabase,
  ]);

  return (
    <div
      className="nodeCard node-with-hover"
      onMouseEnter={() => setShowHover(true)}
      onMouseLeave={() => setShowHover(false)}
    >
      <div className="node-header node-header--yellow">VERIFY (SERVER)</div>
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
      <ObjectHover
        object={verificationResult}
        title="Verification Result Object"
        isVisible={showHover}
      />
    </div>
  );
}

const nodeTypes = {
  userInputNode: UserInputNode,
  publicKeyGenerateNode: PublicKeyGenerateNode,
  credentialsNode: CredentialsNode,
  generatedCredentialsNode: GeneratedCredentialsNode,
  databaseSaveNode: DatabaseSaveNode,
  verifyNode: VerifyNode,
};

const WebAuthnRegistration = () => {
  const [username, setUsername] = useState("");
  const [rpName, setRpName] = useState(RP_NAME);
  const [registrationOptions, setRegistrationOptions] = useState<any>(null);
  const [authenticatorResponse, setAuthenticatorResponse] = useState<any>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const nodes = useMemo(
    () => [
      {
        id: "n1",
        type: "userInputNode",
        position: { x: 0, y: 0 },
        data: {},
        draggable: true,
      },
      {
        id: "n2",
        type: "publicKeyGenerateNode",
        position: { x: 350, y: 0 },
        data: {},
        draggable: true,
      },
      {
        id: "n3",
        type: "credentialsNode",
        position: { x: 700, y: 0 },
        data: {},
        draggable: true,
      },
      {
        id: "n4",
        type: "generatedCredentialsNode",
        position: { x: 1050, y: 0 },
        data: {},
        draggable: true,
      },
      {
        id: "n5",
        type: "verifyNode",
        position: { x: 1000, y: 200 },
        data: {},
        draggable: true,
      },
      {
        id: "n6",
        type: "databaseSaveNode",
        position: { x: 700, y: 600 },
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
      { id: "e5-6", source: "n5", target: "n6", animated: true },
    ],
    []
  );

  return (
    <>
      <Header />
      <div className="webauthn-flow-container">
        <WebAuthnRegistrationProvider
          value={{
            username,
            setUsername,
            rpName,
            setRpName,
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
          </ReactFlow>
        </WebAuthnRegistrationProvider>
      </div>
    </>
  );
};

export default WebAuthnRegistration;
