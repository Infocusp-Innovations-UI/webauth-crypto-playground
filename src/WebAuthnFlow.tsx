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
  verificationPublicKeyJwk: string;
  setVerificationPublicKeyJwk: (v: string) => void;
  verificationResult: string;
  signature: string;
  verified: boolean | null;
  usedAlgorithm: Algorithm | null;
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
  verificationPublicKeyJwk: "",
  setVerificationPublicKeyJwk: () => {},
  verificationResult: "",
  signature: "",
  verified: null,
  usedAlgorithm: null,
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

function VerificationKeyNode() {
  const { verificationPublicKeyJwk, setVerificationPublicKeyJwk } = useContext(WebAuthnContext);

  return (
    <div className="nodeCard nodeCard--wide">
      <div className="node-header node-header--purple">VERIFICATION PUBLIC KEY</div>
      <div className="node-body">
        <label className="node-label">Public Key (Input)</label>
        <textarea
          className="node-textarea"
          value={verificationPublicKeyJwk}
          onChange={(e) => setVerificationPublicKeyJwk(e.target.value)}
          placeholder="Public key will be pre-populated..."
        />
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function VerificationNode() {
  const { handleVerify } = useContext(WebAuthnContext);

  return (
    <div className="nodeCard">
      <div className="node-header node-header--orange">VERIFICATION</div>
      <div className="node-body">
        <button className="node-button" onClick={handleVerify}>
          Verify
        </button>
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function ChallengeNode() {
  const { verificationResult } = useContext(WebAuthnContext);
  const hasStartedVerification = verificationResult !== "";

  return (
    <div className="nodeCard nodeCard--wide">
      <div className="node-header node-header--teal">1. CREATE CHALLENGE</div>
      <div className="node-body">
        <div className="node-code">
          <code>const enc = new TextEncoder();</code>
          <code>const challenge = enc.encode("webauthn-demo-challenge");</code>
        </div>
        {hasStartedVerification && (
          <div className="node-output">
            <label className="node-label">Output:</label>
            <small>Uint8Array (23 bytes)</small>
          </div>
        )}
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function SigningNode() {
  const { verificationResult, usedAlgorithm, signature } = useContext(WebAuthnContext);
  const hasStartedVerification = verificationResult !== "";
  const algo = usedAlgorithm || "RS256";

  return (
    <div className="nodeCard nodeCard--wide">
      <div className="node-header node-header--indigo">2. SIGN WITH PRIVATE KEY</div>
      <div className="node-body">
        <div className="node-code">
          <code>crypto.subtle.sign(</code>
          <code style={{ paddingLeft: '20px' }}>
            {algo.startsWith("ES") 
              ? `{ name: "ECDSA", hash: "SHA-256" },`
              : `"RSASSA-PKCS1-v1_5",`
            }
          </code>
          <code style={{ paddingLeft: '20px' }}>storedPrivateKey,</code>
          <code style={{ paddingLeft: '20px' }}>challenge</code>
          <code>)</code>
        </div>
        {hasStartedVerification && (
          <div className="node-output">
            <label className="node-label">Output (signature):</label>
            <small style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {signature || "Generating..."}
            </small>
          </div>
        )}
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function KeyCheckNode() {
  const { verificationResult, publicKeyJwk, verificationPublicKeyJwk } = 
    useContext(WebAuthnContext);
  const hasStartedVerification = verificationResult !== "";
  const keysMatch = publicKeyJwk === verificationPublicKeyJwk;

  return (
    <div className="nodeCard">
      <div className="node-header node-header--yellow">3. KEY CHECK</div>
      <div className="node-body">
        <div className="node-code">
          <code>if (originalKey === inputKey)</code>
        </div>
        {hasStartedVerification && (
          <div className={`node-output ${keysMatch ? 'node-result--success' : 'node-result--error'}`}>
            <label className="node-label">Result:</label>
            <small>
              {keysMatch 
                ? `✅ Match! Keys are identical`
                : `❌ Mismatch! Keys are different`
              }
            </small>
          </div>
        )}
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function VerifyOperationNode() {
  const { verificationResult, verificationAlgorithm, verified } = useContext(WebAuthnContext);
  const hasStartedVerification = verificationResult !== "";
  const isSuccess = verificationResult.includes("✅");

  return (
    <div className="nodeCard nodeCard--wide">
      <div className="node-header node-header--pink">4. VERIFY SIGNATURE</div>
      <div className="node-body">
        <div className="node-code">
          <code>crypto.subtle.verify(</code>
          <code style={{ paddingLeft: '20px' }}>
            {verificationAlgorithm.startsWith("ES") 
              ? `{ name: "${verificationAlgorithm}", hash: "SHA-256" },`
              : `"RSASSA-PKCS1-v1_5",`
            }
          </code>
          <code style={{ paddingLeft: '20px' }}>storedPublicKey,</code>
          <code style={{ paddingLeft: '20px' }}>signature,</code>
          <code style={{ paddingLeft: '20px' }}>challenge</code>
          <code>)</code>
        </div>
        {hasStartedVerification && verified !== null && (
          <div className={`node-output ${isSuccess ? 'node-result--success' : 'node-result--error'}`}>
            <label className="node-label">Output (verified):</label>
            <small>
              {String(verified)} {verified ? "✅" : "❌"}
            </small>
          </div>
        )}
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
  verificationKeyNode: VerificationKeyNode,
  verificationNode: VerificationNode,
  challengeNode: ChallengeNode,
  signingNode: SigningNode,
  keyCheckNode: KeyCheckNode,
  verifyOperationNode: VerifyOperationNode,
  resultNode: ResultNode,
};

const WebAuthnFlow = () => {
  const [registrationAlgorithm, setRegistrationAlgorithm] =
    useState<Algorithm>("RS256");
  const [verificationAlgorithm, setVerificationAlgorithm] =
    useState<Algorithm>("RS256");
  const [publicKeyJwk, setPublicKeyJwk] = useState("");
  const [privateKeyJwk, setPrivateKeyJwk] = useState("");
  const [verificationPublicKeyJwk, setVerificationPublicKeyJwk] = useState("");
  const [verificationResult, setVerificationResult] = useState("");
  const [signature, setSignature] = useState("");
  const [verified, setVerified] = useState<boolean | null>(null);

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
      setVerificationPublicKeyJwk(JSON.stringify(publicJwk, null, 2));
      setStoredPublicKey(keypair.publicKey);
      setStoredPrivateKey(keypair.privateKey);
      setUsedAlgorithm(registrationAlgorithm);
      setVerificationResult("");
      setSignature("");
      setVerified(null);
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
      // Use registration algorithm for verification as we assume the user claims to be the same
      const verificationConfig = algorithmConfigs[usedAlgorithm];

      // Create a challenge
      const enc = new TextEncoder();
      const challenge = enc.encode("webauthn-demo-challenge");

      // Sign with private key using registration algorithm
      let signatureBuffer: ArrayBuffer;
      if (usedAlgorithm.startsWith("ES")) {
        signatureBuffer = await crypto.subtle.sign(
          { name: registrationConfig.webcryptoName, hash: "SHA-256" },
          storedPrivateKey,
          challenge
        );
      } else {
        signatureBuffer = await crypto.subtle.sign(
          registrationConfig.webcryptoName,
          storedPrivateKey,
          challenge
        );
      }

      // Convert signature to hex string for display
      const signatureArray = new Uint8Array(signatureBuffer);
      const signatureHex = Array.from(signatureArray)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      const displaySig = `${signatureHex.slice(0, 16)}...${signatureHex.slice(-16)} (${signatureArray.length} bytes)`;
      setSignature(displaySig);

      // Verify logic
      let verifiedResult = false;
      
      if (verificationPublicKeyJwk === publicKeyJwk) {
        // Keys match - verification should succeed
        if (usedAlgorithm.startsWith("ES")) {
          verifiedResult = await crypto.subtle.verify(
            { name: verificationConfig.webcryptoName, hash: "SHA-256" },
            storedPublicKey,
            signatureBuffer,
            challenge
          );
        } else {
          verifiedResult = await crypto.subtle.verify(
            verificationConfig.webcryptoName,
            storedPublicKey,
            signatureBuffer,
            challenge
          );
        }
        
        setVerified(verifiedResult);
        
        if (verifiedResult) {
          setVerificationResult(
            `✅ SUCCESS: Keys match and signature verified!`
          );
        } else {
          setVerificationResult(
            `❌ FAIL: Verification failed unexpectedly`
          );
        }
      } else {
        // Keys don't match - show error
        setVerified(false);
        setVerificationResult(
          `❌ FAIL: Public Key mismatch!\nThe provided public key does not match the registered key.`
        );
      }
    } catch (err) {
      setVerified(false);
      setVerificationResult(
        `❌ ERROR: ${err instanceof Error ? err.message : "Verification failed"}`
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
        type: "verificationKeyNode",
        position: { x: 670, y: 120 },
        data: {},
        draggable: true,
      },
      {
        id: "n4",
        type: "verificationNode",
        position: { x: 1040, y: 120 },
        data: {},
        draggable: true,
      },
      // Detailed verification process nodes
      {
        id: "n5",
        type: "challengeNode",
        position: { x: 1040, y: 350 },
        data: {},
        draggable: true,
      },
      {
        id: "n6",
        type: "signingNode",
        position: { x: 1040, y: 550 },
        data: {},
        draggable: true,
      },
      {
        id: "n7",
        type: "keyCheckNode",
        position: { x: 1040, y: 850 },
        data: {},
        draggable: true,
      },
      {
        id: "n8",
        type: "verifyOperationNode",
        position: { x: 1040, y: 1000 },
        data: {},
        draggable: true,
      },
      {
        id: "n9",
        type: "resultNode",
        position: { x: 1370, y: 120 },
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
      { id: "e4-9", source: "n4", target: "n9", animated: true },
      // Detailed verification flow
      { id: "e4-5", source: "n4", target: "n5", animated: true, type: "step" },
      { id: "e5-6", source: "n5", target: "n6", animated: true },
      { id: "e6-7", source: "n6", target: "n7", animated: true },
      { id: "e7-8", source: "n7", target: "n8", animated: true },
      { id: "e8-9", source: "n8", target: "n9", animated: true, type: "step" },
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
          verificationPublicKeyJwk,
          setVerificationPublicKeyJwk,
          verificationResult,
          signature,
          verified,
          usedAlgorithm,
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
