import React, { useState } from "react";

export default function WebCryptoDemo() {
  const [publicKeyJwk, setPublicKeyJwk] = useState("");
  const [privateKeyJwk, setPrivateKeyJwk] = useState("");

  const [loginPrivateKey, setLoginPrivateKey] = useState("");
  const [result, setResult] = useState("");

  let storedPublicKey = null; // acts like a server-side database

  async function generateKeypair() {
    const keypair = await window.crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"]
    );

    const publicJwk = await crypto.subtle.exportKey("jwk", keypair.publicKey);
    const privateJwk = await crypto.subtle.exportKey("jwk", keypair.privateKey);

    storedPublicKey = publicJwk;

    setPublicKeyJwk(JSON.stringify(publicJwk, null, 2));
    setPrivateKeyJwk(JSON.stringify(privateJwk, null, 2));
  }

  async function login() {
    try {
      const privateKey = await crypto.subtle.importKey(
        "jwk",
        JSON.parse(loginPrivateKey),
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["sign"]
      );

      const enc = new TextEncoder();
      const challenge = enc.encode("demo-challenge");

      // Sign with private key
      const signature = await crypto.subtle.sign(
        "RSASSA-PKCS1-v1_5",
        privateKey,
        challenge
      );

      // Verify with stored public key
      const publicKey = await crypto.subtle.importKey(
        "jwk",
        JSON.parse(publicKeyJwk),
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["verify"]
      );

      const verified = await crypto.subtle.verify(
        "RSASSA-PKCS1-v1_5",
        publicKey,
        signature,
        challenge
      );

      setResult(verified ? "✅ SUCCESS: Correct private key!" : "❌ FAIL: Wrong private key");
    } catch (err) {
      setResult("❌ FAIL: Invalid private key format");
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h2>🔐 WebCrypto Demo (Simulating WebAuthn Behavior)</h2>

      <button onClick={generateKeypair}>Generate Keypair (Registration)</button>

      <h3>Public Key (Stored on Server)</h3>
      <textarea style={{ width: "100%", height: 120 }} value={publicKeyJwk} readOnly />

      <h3>Private Key (User-Controlled)</h3>
      <textarea style={{ width: "100%", height: 120 }} value={privateKeyJwk} readOnly />

      <hr />

      <h2>🔑 Login Simulation</h2>

      <p>Paste the private key below. If it matches, login succeeds.</p>

      <textarea
        style={{ width: "100%", height: 120 }}
        placeholder="Paste private key here"
        value={loginPrivateKey}
        onChange={(e) => setLoginPrivateKey(e.target.value)}
      />

      <button onClick={login} style={{ marginTop: 10 }}>
        Login
      </button>

      <h3>{result}</h3>
    </div>
  );
}
