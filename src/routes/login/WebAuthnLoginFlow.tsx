import React, { useMemo, useState, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  VerifyAuthenticationResponseOpts,
} from "@simplewebauthn/server";
import { startAuthentication } from "@simplewebauthn/browser";
import { useUserContext } from "../../context/UserContext";
import "./WebAuthnLogin.css";
import Header from "../../component/Header";
import { useWebAuthnLoginContext, WebAuthnLoginProvider } from "../../context/WebAuthnLoginContext";

const RP_ID = "webauth-crypto-playground.vercel.app";
const expectedOrigin = "https://webauth-crypto-playground.vercel.app";

function ObjectHover({ object, title, isVisible }: any) {
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

/* ---------------- USER INPUT ---------------- */
function UserInputNode() {
  const { username, setUsername } = useWebAuthnLoginContext();
  const [showHover, setShowHover] = useState(false);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  return (
    <div
      className="nodeCard node-with-hover"
      onMouseEnter={() => setShowHover(true)}
      onMouseLeave={() => setShowHover(false)}
    >
      <div className="node-header node-header--purple">
        USER INPUT (CLIENT)
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
      </div>
      <Handle type="source" position={Position.Right} />
      <ObjectHover object={{ username }} title="User Input Object" isVisible={showHover} />
    </div>
  );
}

/* ---------------- AUTH OPTIONS GENERATION ---------------- */
function PublicKeyGenerateNode() {
  const { username, authOptions, setAuthOptions } =
    useWebAuthnLoginContext();
  const { users } = useUserContext();
  // console.log(users, username)
  const [showHover, setShowHover] = useState(false);

  const createAuthOptions = useCallback(async () => {
    if (!username) {
      alert("Please enter username first!");
      return;
    }

    const user = users.find((u) => u.username === username);
    if (!user || !user.credentials.length) {
      alert("No credentials found for this user!");
      return;
    }

    const opts = {
      timeout: 60000,
      allowCredentials: user.credentials.map((cred) => ({
        id: cred.id,
        type: "public-key",
      })),
      userVerification: "preferred" as const,
      rpID: RP_ID,
    };

    const options = await generateAuthenticationOptions(opts);
    setAuthOptions(options);
  }, [username, users, setAuthOptions]);

  return (
    <div
      className="nodeCard node-with-hover"
      onMouseEnter={() => setShowHover(true)}
      onMouseLeave={() => setShowHover(false)}
    >
      <div className="node-header node-header--yellow">
        AUTH OPTIONS (SERVER)
      </div>
      <div className="node-body">
        <button
          className="node-button"
          onClick={createAuthOptions}
          disabled={!username}
          onMouseDown={(e) => e.stopPropagation()}
        >
          Generate Auth Options
        </button>
        <div className="node-output">
          {authOptions ? "Auth Options Created ✓" : "Click to generate"}
        </div>
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <ObjectHover object={authOptions} title="Auth Options Object" isVisible={showHover} />
    </div>
  );
}

/* ---------------- CREATE ASSERTION ---------------- */
function CredentialsNode() {
  const { authOptions, authResponse, setAuthResponse } =
    useWebAuthnLoginContext();
  const [showHover, setShowHover] = useState(false);

  const createAssertion = useCallback(async () => {
    if (!authOptions) {
      alert("Please generate auth options first!");
      return;
    }
    try {
      const asseResp = await startAuthentication(authOptions);
      setAuthResponse(asseResp);
      alert("Assertion created successfully!");
    } catch (error) {
      alert(`Authentication failed: ${error}`);
    }
  }, [authOptions, setAuthResponse]);

  return (
    <div
      className="nodeCard node-with-hover"
      onMouseEnter={() => setShowHover(true)}
      onMouseLeave={() => setShowHover(false)}
    >
      <div className="node-header node-header--purple">
        CREATE ASSERTION (CLIENT)
      </div>
      <div className="node-body">
        <button
          className="node-button"
          onClick={createAssertion}
          disabled={!authOptions}
          onMouseDown={(e) => e.stopPropagation()}
        >
          Create Assertion
        </button>
        <div className="node-output">
          {authResponse ? "Assertion Created ✓" : "Click to create"}
        </div>
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Bottom} />
      <ObjectHover object={authResponse} title="Auth Response Object" isVisible={showHover} />
    </div>
  );
}

/* ---------------- VERIFY ---------------- */
function VerifyNode() {
  const { username, authResponse, authOptions, verificationResult, setVerificationResult } =
    useWebAuthnLoginContext();
  const [showHover, setShowHover] = useState(false);
  const { users } = useUserContext();

  const verifyResponse = useCallback(async () => {
  const user = users.find((u) => u.username === username);

  if (!user) {
    console.error("User not found");
    return;
  }

  const dbCredential = user.credentials.find(
    (cred) => cred.id === authResponse.id
  );

  if (!dbCredential) {
    console.error("No matching credential found");
    return;
  }

  try {
    const opts: VerifyAuthenticationResponseOpts = {
      response: authResponse,
      expectedChallenge: authOptions.challenge,
      expectedOrigin,
      expectedRPID: RP_ID,
      credential: dbCredential,
      requireUserVerification: false,
    };

    const verification = await verifyAuthenticationResponse(opts);

    setVerificationResult(verification);
  } catch (error) {
    const _error = error as Error;
    console.error("Authentication verification failed:", _error);
    setVerificationResult({ verified: false, error: _error.message });
  }
}, [username, users, authResponse, authOptions, setVerificationResult]);


  return (
    <div
      className="nodeCard node-with-hover"
      onMouseEnter={() => setShowHover(true)}
      onMouseLeave={() => setShowHover(false)}
    >
      <div className="node-header node-header--yellow">VERIFY (SERVER)</div>
      <div className="node-body">
        <button
          className="node-button"
          onClick={verifyResponse}
          disabled={!authResponse || !authOptions}
          onMouseDown={(e) => e.stopPropagation()}
        >
          Verify Assertion
        </button>
        <div className="node-output">
          {verificationResult?.verified
            ? "Authentication Successful ✓"
            : "Verification Pending ..."}
        </div>
      </div>
      <Handle type="target" position={Position.Top} />
      <ObjectHover object={verificationResult} title="Verification Result Object" isVisible={showHover} />
    </div>
  );
}

const nodeTypes = {
  userInputNode: UserInputNode,
  publicKeyGenerateNode: PublicKeyGenerateNode,
  credentialsNode: CredentialsNode,
  verifyNode: VerifyNode,
};

const WebAuthnLogin = () => {
  const [username, setUsername] = useState("");
  const [authOptions, setAuthOptions] = useState<any>(null);
  const [authResponse, setAuthResponse] = useState<any>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const nodes = useMemo(
    () => [
      { id: "n1", type: "userInputNode", position: { x: 0, y: 0 }, data: {} },
      { id: "n2", type: "publicKeyGenerateNode", position: { x: 350, y: 0 }, data: {} },
      { id: "n3", type: "credentialsNode", position: { x: 700, y: 0 }, data: {} },
      { id: "n4", type: "verifyNode", position: { x: 1050, y: 0 }, data: {} },
    ],
    []
  );

  const edges = useMemo(
    () => [
      { id: "e1-2", source: "n1", target: "n2", animated: true },
      { id: "e2-3", source: "n2", target: "n3", animated: true },
      { id: "e3-4", source: "n3", target: "n4", animated: true },
    ],
    []
  );

  return (
    <>
      <Header />
      <div className="webauthn-flow-container">
        <WebAuthnLoginProvider
          value={{
            username,
            setUsername,
            authOptions,
            setAuthOptions,
            authResponse,
            setAuthResponse,
            verificationResult,
            setVerificationResult,
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            nodesDraggable
            nodesConnectable={false}
            elementsSelectable
            proOptions={{ hideAttribution: true }}
          >
            <Background />
          </ReactFlow>
        </WebAuthnLoginProvider>
      </div>
    </>
  );
};

export default WebAuthnLogin;
