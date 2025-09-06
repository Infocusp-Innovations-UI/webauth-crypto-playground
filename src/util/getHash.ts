export async function getHashSteps(
  message: string,
  algorithm: AlgorithmIdentifier = "SHA-256"
) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);

  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const bytes = new Uint8Array(hashBuffer);

  // Hex string with 0x prefix
  const hex =
    "0x" +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

  return { hex };
}
