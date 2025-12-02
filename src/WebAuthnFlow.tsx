import React, { useEffect, useMemo, useState, useContext } from "react";
import ReactFlow, { Background, Controls, Handle, Position } from "reactflow";
import "reactflow/dist/style.css";
import "./WebAuthnFlow.css";

type Algorithm = "RS256" | "ES256" | "ES384" | "ES512";

interface AlgorithmConfig {
  name: string;
  webcryptoName: string;
  params: any;
  keyUsages: KeyUsage[];
}

const algorithmConfigs: Record<Algorithm, AlgorithmConfig> = {
  RS256: {
    name: "RSASSA-PKCS1-v1_5",
    webcryptoName: "RSASSA-PKCS1-v1_5",
    params: {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    keyUsages: ["sign", "verify"],
  },
  ES256: {
    name: "ECDSA",
    webcryptoName: "ECDSA",
    params: {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    keyUsages: ["sign", "verify"],
  },
  ES384: {
    name: "ECDSA",
    webcryptoName: "ECDSA",
    params: {
      name: "ECDSA",
      namedCurve: "P-384",
    },
    keyUsages: ["sign", "verify"],
  },
  ES512: {
    name: "ECDSA",
    webcryptoName: "ECDSA",
    params: {
      name: "ECDSA",
      namedCurve: "P-521",
    },
    keyUsages: ["sign", "verify"],
  },
};

interface WebAuthnContextType {
  registrationAlgorithm: Algorithm;
  setRegistrationAlgorithm: (v: Algorithm) => void;
  verificationAlgorithm: Algorithm;
  setVerificationAlgorithm: (v: Algorithm) => void;
  publicKeyJwk: string;
  privateKeyJwk: string;
  verificationResult: string;
  handleRegister: () => void;
  handleVerify: () => void;
}

const WebAuthnContext = React.createContext<WebAuthnContextType>({
  registrationAlgorithm: "RS256",
  setRegistrationAlgorithm: () => {},
  verificationAlgorithm: "RS256",
  setVerificationAlgorithm: () => {},
  publicKeyJwk: "",
  privateKeyJwk: "",
  verificationResult: "",
  handleRegister: () => {},
  handleVerify: () => {},
});

function RegistrationNode() {
  const { registrationAlgorithm, setRegistrationAlgorithm, handleRegister } =
    useContext(WebAuthnContext);

  return (
    <div className="nodeCard">
      <div className="node-header node-header--blue">REGISTRATION</div>
      <div className="node-body">
        <label className="node-label">Algorithm</label>
        <select
          className="node-select"
          value={registrationAlgorithm}
          onChange={(e) => setRegistrationAlgorithm(e.target.value as Algorithm)}
        >
          <option value="RS256">RS256 (RSA)</option>
          <option value="ES256">ES256 (ECDSA P-256)</option>
          <option value="ES384">ES384 (ECDSA P-384)</option>
          <option value="ES512">ES512 (ECDSA P-521)</option>
        </select>
        <button className="node-button" onClick={handleRegister}>
          Generate Keys
        </button>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function KeyStorageNode() {
  const { publicKeyJwk, privateKeyJwk } = useContext(WebAuthnContext);

  return (
    <div className="nodeCard nodeCard--wide">
      <div className="node-header node-header--purple">KEY STORAGE</div>
      <div className="node-body">
        <label className="node-label">Public Key (Server)</label>
        <textarea
          className="node-textarea"
          value={publicKeyJwk}
          readOnly
          placeholder="Public key will appear here..."
        />
        <label className="node-label" style={{ marginTop: "10px" }}>
          Private Key (User Device)
        </label>
        <textarea
          className="node-textarea"
          value={privateKeyJwk}
          readOnly
          placeholder="Private key will appear here..."
        />
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function VerificationNode() {
  const { verificationAlgorithm, setVerificationAlgorithm, handleVerify } =
    useContext(WebAuthnContext);

  return (
    <div className="nodeCard">
      <div className="node-header node-header--orange">VERIFICATION</div>
      <div className="node-body">
        <label className="node-label">Algorithm</label>
        <select
          className="node-select"
          value={verificationAlgorithm}
          onChange={(e) => setVerificationAlgorithm(e.target.value as Algorithm)}
        >
          <option value="RS256">RS256 (RSA)</option>
          <option value="ES256">ES256 (ECDSA P-256)</option>
          <option value="ES384">ES384 (ECDSA P-384)</option>
          <option value="ES512">ES512 (ECDSA P-521)</option>
        </select>
        <button className="node-button" onClick={handleVerify}>
          Verify
        </button>
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function ResultNode() {
  const { verificationResult, registrationAlgorithm, verificationAlgorithm } =
    useContext(WebAuthnContext);

  const getResultClass = () => {
    if (verificationResult.includes("✅")) return "node-result--success";
    if (verificationResult.includes("❌")) return "node-result--error";
    return "";
  };

  return (
    <div className="nodeCard">
      <div className="node-header node-header--green">RESULT</div>
      <div className={`node-body node-result ${getResultClass()}`}>
        {verificationResult || "Click 'Verify' to check authentication"}
        {verificationResult && (
          <div className="node-result-details">
            <small>
              Registration: {registrationAlgorithm}
              <br />
              Verification: {verificationAlgorithm}
            </small>
          </div>
        )}
      </div>
      <Handle type="target" position={Position.Left} />
    </div>
  );
}

const nodeTypes = {
  registrationNode: RegistrationNode,
  keyStorageNode: KeyStorageNode,
  verificationNode: VerificationNode,
  resultNode: ResultNode,
};

const WebAuthnFlow = () => {
  const [registrationAlgorithm, setRegistrationAlgorithm] =
    useState<Algorithm>("RS256");
  const [verificationAlgorithm, setVerificationAlgorithm] =
    useState<Algorithm>("RS256");
  const [publicKeyJwk, setPublicKeyJwk] = useState("");
  const [privateKeyJwk, setPrivateKeyJwk] = useState("");
  const [verificationResult, setVerificationResult] = useState("");

  // Store the actual CryptoKey objects
  const [storedPublicKey, setStoredPublicKey] = useState<CryptoKey | null>(null);
  const [storedPrivateKey, setStoredPrivateKey] = useState<CryptoKey | null>(null);
  const [usedAlgorithm, setUsedAlgorithm] = useState<Algorithm | null>(null);

  const handleRegister = async () => {
    try {
      const config = algorithmConfigs[registrationAlgorithm];
      const keypair = await window.crypto.subtle.generateKey(
        config.params,
        true,
        config.keyUsages as any
      );

      const publicJwk = await crypto.subtle.exportKey("jwk", keypair.publicKey);
      const privateJwk = await crypto.subtle.exportKey(
        "jwk",
        keypair.privateKey
      );

      setPublicKeyJwk(JSON.stringify(publicJwk, null, 2));
      setPrivateKeyJwk(JSON.stringify(privateJwk, null, 2));
      setStoredPublicKey(keypair.publicKey);
      setStoredPrivateKey(keypair.privateKey);
      setUsedAlgorithm(registrationAlgorithm);
      setVerificationResult("");
    } catch (err) {
      setVerificationResult(`❌ Registration failed: ${err}`);
    }
  };

  const handleVerify = async () => {
    if (!storedPublicKey || !storedPrivateKey || !usedAlgorithm) {
      setVerificationResult("❌ Please register first!");
      return;
    }

    try {
      const registrationConfig = algorithmConfigs[usedAlgorithm];
      const verificationConfig = algorithmConfigs[verificationAlgorithm];

      // Create a challenge
      const enc = new TextEncoder();
      const challenge = enc.encode("webauthn-demo-challenge");

      // Sign with private key using registration algorithm
      let signature: ArrayBuffer;
      if (usedAlgorithm.startsWith("ES")) {
        signature = await crypto.subtle.sign(
          { name: registrationConfig.webcryptoName, hash: "SHA-256" },
          storedPrivateKey,
          challenge
        );
      } else {
        signature = await crypto.subtle.sign(
          registrationConfig.webcryptoName,
          storedPrivateKey,
          challenge
        );
      }

      // Try to verify with selected verification algorithm
      let verified = false;
      
      if (usedAlgorithm === verificationAlgorithm) {
        // Algorithms match - verification should succeed
        if (verificationAlgorithm.startsWith("ES")) {
          verified = await crypto.subtle.verify(
            { name: verificationConfig.webcryptoName, hash: "SHA-256" },
            storedPublicKey,
            signature,
            challenge
          );
        } else {
          verified = await crypto.subtle.verify(
            verificationConfig.webcryptoName,
            storedPublicKey,
            signature,
            challenge
          );
        }
        
        if (verified) {
          setVerificationResult(
            `✅ SUCCESS: Algorithms match! (${usedAlgorithm})`
          );
        } else {
          setVerificationResult(
            `❌ FAIL: Verification failed unexpectedly`
          );
        }
      } else {
        // Algorithms don't match - show error
        setVerificationResult(
          `❌ FAIL: Algorithm mismatch!\nRegistered with ${usedAlgorithm}, trying to verify with ${verificationAlgorithm}`
        );
      }
    } catch (err) {
      setVerificationResult(
        `❌ ERROR: ${err instanceof Error ? err.message : "Verification failed"}\n` +
        `Registration: ${usedAlgorithm}, Verification: ${verificationAlgorithm}`
      );
    }
  };

  const nodes = useMemo(
    () => [
      {
        id: "n1",
        type: "registrationNode",
        position: { x: 0, y: 120 },
        data: {},
        draggable: true,
      },
      {
        id: "n2",
        type: "keyStorageNode",
        position: { x: 300, y: 120 },
        data: {},
        draggable: true,
      },
      {
        id: "n3",
        type: "verificationNode",
        position: { x: 670, y: 120 },
        data: {},
        draggable: true,
      },
      {
        id: "n4",
        type: "resultNode",
        position: { x: 1000, y: 120 },
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
    ],
    []
  );

  return (
    <div className="webauthn-flow-container">
      <div className="flow-header">
        <h2>🔐 WebAuthn Algorithm Flow Demo</h2>
        <p>
          Select algorithms for registration and verification. They must match for
          successful authentication!
        </p>
      </div>
      <WebAuthnContext.Provider
        value={{
          registrationAlgorithm,
          setRegistrationAlgorithm,
          verificationAlgorithm,
          setVerificationAlgorithm,
          publicKeyJwk,
          privateKeyJwk,
          verificationResult,
          handleRegister,
          handleVerify,
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          proOptions={{ hideAttribution: true }}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </WebAuthnContext.Provider>
    </div>
  );
};

export default WebAuthnFlow;
