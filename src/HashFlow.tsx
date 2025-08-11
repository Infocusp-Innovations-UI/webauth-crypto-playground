import React, { useEffect, useMemo, useState, useContext } from "react";
import ReactFlow, { Background, Controls, Handle, Position } from "reactflow";
import "reactflow/dist/style.css";
import { getHashSteps } from "./getHash";
import "./HashFlow.css";

const HashContext = React.createContext({
  input: "",
  setInput: (v: string) => {},
  algorithm: "SHA-256",
  setAlgorithm: (v: string) => {},
  hex: "",
});

function InputNode() {
  const { input, setInput } = useContext(HashContext);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };
  return (
    <div className="nodeCard">
      <div className="node-header node-header--green">INPUT</div>
      <div className="node-body">
        <input
          className="node-input"
          type="text"
          value={input}
          onChange={handleChange}
          placeholder="Type text here"
        />
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function HashNode() {
  const { algorithm, setAlgorithm } = useContext(HashContext);
  return (
    <div className="nodeCard">
      <div className="node-header node-header--red">HASH</div>
      <div className="node-body">
        <label className="node-label">Algorithm</label>
        <select
          className="node-select"
          value={algorithm}
          onChange={(e) => setAlgorithm(e.target.value)}
        >
          <option value="SHA-1">SHA-1</option>
          <option value="SHA-256">SHA-256</option>
          <option value="SHA-384">SHA-384</option>
          <option value="SHA-512">SHA-512</option>
        </select>
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function ResultNode({ data }) {
  const { hex } = useContext(HashContext);
  return (
    <div className="nodeCard">
      <div className="node-header  node-header--green node-header-hash-result">
        HASH RESULT
      </div>
      <div className="node-body node-output" title={hex}>
        {hex}
      </div>
      <Handle type="target" position={Position.Left} />
    </div>
  );
}

const nodeTypes = {
  stringNode: InputNode,
  hashNode: HashNode,
  resultNode: ResultNode,
};

const HashFlow = () => {
  const [input, setInput] = useState("hello");
  const [algorithm, setAlgorithm] = useState("SHA-256");
  const [hashString, setHashString] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { hex } = await getHashSteps(input, algorithm);
      if (!cancelled) setHashString(hex);
    })();
    return () => {
      cancelled = true;
    };
  }, [input, algorithm]);

  const nodes = useMemo(
    () => [
      {
        id: "n1",
        type: "stringNode",
        position: { x: 0, y: 120 },
        data: {},
        draggable: true,
      },
      {
        id: "n2",
        type: "hashNode",
        position: { x: 320, y: 120 },
        data: {},
        draggable: true,
      },
      {
        id: "n3",
        type: "resultNode",
        position: { x: 640, y: 120 },
        data: {},
        style: { width: 360 },
        draggable: true,
      },
    ],
    []
  );

  const edges = useMemo(
    () => [
      { id: "e1-2", source: "n1", target: "n2", animated: true },
      { id: "e2-3", source: "n2", target: "n3", animated: true },
    ],
    []
  );

  return (
    <div className="hashflow-container">
      <HashContext.Provider
        value={{ input, setInput, algorithm, setAlgorithm, hex: hashString }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </HashContext.Provider>
    </div>
  );
};

export default HashFlow;
