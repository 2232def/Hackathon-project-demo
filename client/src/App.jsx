import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  useReactFlow,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import axios from 'axios';
import { io } from 'socket.io-client';
import { StartNode, ActionNode, EndNode } from './CustomNodes';

const socket = io('http://localhost:3001');
const flowKey = 'workflow-save-key';

const initialNodes = [
  { id: '1', type: 'start', data: { label: 'New Lead' }, position: { x: 250, y: 50 } },
];

let id = 0;
const getId = () => `dndnode_${id++}`;

const Flow = () => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [rfInstance, setRfInstance] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]); // State for execution logs
  
  const { setViewport, screenToFlowPosition, fitView } = useReactFlow();

  const onAutoLayout = useCallback(() => {
    // Basic Tree Layout Algorithm
    const levels = {};
    const nodeIds = nodes.map(n => n.id);
    
    // Initialize levels
    nodeIds.forEach(id => { levels[id] = 0; });

    // Calculate levels based on edges (Longest Path)
    const visited = new Set();
    const processNode = (nodeId, level) => {
        levels[nodeId] = Math.max(levels[nodeId] || 0, level);
        visited.add(nodeId);
        
        const children = edges
            .filter(e => e.source === nodeId)
            .map(e => e.target);
            
        children.forEach(childId => processNode(childId, level + 1));
    };

    // Find roots (nodes with no incoming edges)
    const targets = new Set(edges.map(e => e.target));
    const roots = nodeIds.filter(id => !targets.has(id));

    // If no roots (cycle), just pick the first node
    const startNodes = roots.length > 0 ? roots : [nodeIds[0]];
    
    startNodes.forEach(id => processNode(id, 0));

    // Group by Level
    const levelGroups = {};
    Object.entries(levels).forEach(([id, lvl]) => {
        if (!levelGroups[lvl]) levelGroups[lvl] = [];
        levelGroups[lvl].push(id);
    });

    // Apply Positions
    const newNodes = nodes.map(node => {
        const lvl = levels[node.id];
        const siblings = levelGroups[lvl];
        const index = siblings.indexOf(node.id);
        
        // Grid metrics (aligned to 16px)
        const X_SPACING = 240; 
        const Y_SPACING = 160; 
        
        const rowWidth = siblings.length * X_SPACING;
        const xStart = 400 - (rowWidth / 2); // Center around 400
        
        const x = xStart + (index * X_SPACING);
        const y = 50 + (lvl * Y_SPACING);

        return {
            ...node,
            position: { x, y }
        };
    });

    setNodes(newNodes);
    setTimeout(() => fitView({ padding: 0.2 }), 50);
  }, [nodes, edges, setNodes, fitView]);

  const nodeTypes = useMemo(() => ({
    start: StartNode,
    action: ActionNode,
    end: EndNode,
  }), []);

  useEffect(() => {
    socket.on('connect', () => console.log("Connected to backend"));

    socket.on('node-status', (data) => {
        setNodes((nds) => nds.map((node) => {
            if (node.id === data.nodeId) {
                return { ...node, className: `status-${data.status}` };
            }
            return node;
        }));
    });

    socket.on('workflow-status', (data) => {
        if (data.status === 'completed') setIsRunning(false);
    });

    // Listen for server logs
    socket.on('execution-log', (data) => {
        setLogs((prev) => [...prev, data]);
    });

    return () => {
        socket.off('node-status');
        socket.off('workflow-status');
        socket.off('execution-log');
        socket.off('connect');
    };
  }, [setNodes]);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      let label = 'New Node';
      if (type === 'start') label = 'Trigger';
      if (type === 'action') label = 'Action';
      if (type === 'end') label = 'End';

      const newNode = {
        id: getId(),
        type,
        position,
        data: { label: label, message: '' }, // Init with empty message
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes],
  );

  const runWorkflow = async () => {
      setIsRunning(true);
      setLogs([]); // Clear previous logs
      setNodes((nds) => nds.map(n => ({ ...n, className: '' })));
      try {
          await axios.post('http://localhost:3001/execute', { nodes, edges });
      } catch (err) {
          console.error(err);
          setIsRunning(false);
          alert("Failed to start workflow");
      }
  };

  const onSave = useCallback(() => {
    if (rfInstance) {
      const flow = rfInstance.toObject();
      localStorage.setItem(flowKey, JSON.stringify(flow));
      alert("Workflow saved!");
    }
  }, [rfInstance]);

  const onRestore = useCallback(() => {
    const restoreFlow = async () => {
      const flow = JSON.parse(localStorage.getItem(flowKey));

      if (flow) {
        const { x = 0, y = 0, zoom = 1 } = flow.viewport;
        setNodes(flow.nodes || []);
        setEdges(flow.edges || []);
        setViewport({ x, y, zoom });
      }
    };
    restoreFlow();
  }, [setNodes, setEdges, setViewport]);

  return (
    <div className="dndflow" style={{ display: 'flex', flexDirection: 'row', height: '100vh', width: '100vw' }}>
      <Sidebar />
      <div style={{ flex: 1, height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        
        {/* Canvas Area */}
        <div className="reactflow-wrapper" ref={reactFlowWrapper} style={{ flex: 1 }}>
            <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onInit={setRfInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            fitView
            snapToGrid={true}
            snapGrid={[16, 16]}
            >
            <Controls />
            <Background color="#aaa" gap={16} />
            
            <Panel position="top-right">
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={onSave} style={{ background: '#333' }}>💾 Save</button>
                    <button onClick={onRestore} style={{ background: '#333' }}>📂 Restore</button>
                    <button onClick={onAutoLayout} style={{ background: '#555' }}>✨ Auto Layout</button>
                    <button 
                        onClick={runWorkflow} 
                        disabled={isRunning} 
                        style={{background: isRunning ? '#ccc' : '#0041d0'}}
                    >
                        {isRunning ? 'Running...' : '▶ Run'}
                    </button>
                </div>
            </Panel>
            </ReactFlow>
        </div>

        {/* Logs Panel */}
        <div style={{ 
            height: '200px', 
            background: '#1e1e1e', 
            color: '#00ff41', 
            fontFamily: 'monospace', 
            padding: '10px', 
            overflowY: 'auto',
            borderTop: '2px solid #333'
        }}>
            <div style={{ marginBottom: '5px', color: '#fff', fontWeight: 'bold' }}>🖥️ Execution Logs</div>
            {logs.length === 0 && <div style={{color: '#666'}}>Ready to execute...</div>}
            {logs.map((log, i) => (
                <div key={i}>
                    <span style={{color: '#888'}}>[{log.timestamp}]</span> {log.message}
                </div>
            ))}
        </div>

      </div>
    </div>
  );
};

const Sidebar = () => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside style={{ width: '250px', background: '#f7f7f7', borderRight: '1px solid #ddd', padding: '15px' }}>
      <div className="description" style={{ marginBottom: '15px', fontWeight: 'bold' }}>Drag blocks:</div>
      <div className="dndnode input" onDragStart={(event) => onDragStart(event, 'start')} draggable>
        ⚡ Trigger
      </div>
      <div className="dndnode" onDragStart={(event) => onDragStart(event, 'action')} draggable>
        ⚙️ Action
      </div>
      <div className="dndnode output" onDragStart={(event) => onDragStart(event, 'end')} draggable>
        🛑 End
      </div>
    </aside>
  );
};

export default function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}