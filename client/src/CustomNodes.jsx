import React, { memo, useState, useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';

const nodeStyles = {
  padding: '10px 15px',
  borderRadius: '8px',
  border: '1px solid #ddd',
  background: '#fff',
  display: 'flex',
  flexDirection: 'column', // Changed to column to fit input
  alignItems: 'flex-start',
  gap: '5px',
  minWidth: '180px',
  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  fontSize: '14px',
  fontWeight: '500',
  color: '#333',
  position: 'relative'
};

const headerStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%'
}

const iconStyles = {
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  color: 'white',
  fontWeight: 'bold',
  fontSize: '12px',
  flexShrink: 0
};

const deleteBtnStyles = {
  position: 'absolute',
  top: '-8px',
  right: '-8px',
  width: '20px',
  height: '20px',
  background: '#ff4d4f',
  color: 'white',
  border: 'none',
  borderRadius: '50%',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  fontWeight: 'bold',
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  zIndex: 10
};

const inputStyles = {
    width: '100%',
    padding: '5px',
    fontSize: '12px',
    border: '1px solid #eee',
    borderRadius: '4px',
    marginTop: '5px',
    boxSizing: 'border-box'
};

const NodeWrapper = ({ id, children, color }) => {
  const { deleteElements } = useReactFlow();

  const handleDelete = (e) => {
    e.stopPropagation();
    deleteElements({ nodes: [{ id }] });
    // Call backend to log deletion if needed
    fetch(`http://localhost:3001/node/${id}`, { method: 'DELETE' }).catch(console.error);
  };

  return (
    <div style={{ ...nodeStyles, borderLeft: `5px solid ${color}` }}>
      {children}
      <button style={deleteBtnStyles} onClick={handleDelete} title="Delete Node">×</button>
    </div>
  );
};

export const StartNode = memo(({ id, data }) => {
  return (
    <NodeWrapper id={id} color="#0041d0">
      <div style={headerStyles}>
        <div style={{ ...iconStyles, background: '#0041d0' }}>⚡</div>
        <div>
          <div style={{ fontSize: '10px', color: '#888' }}>TRIGGER</div>
          {data.label}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </NodeWrapper>
  );
});

export const ActionNode = memo(({ id, data }) => {
    const { setNodes } = useReactFlow();
    
    const handleChange = useCallback((evt) => {
        const val = evt.target.value;
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    node.data = { ...node.data, message: val };
                }
                return node;
            })
        );
    }, [id, setNodes]);

  return (
    <NodeWrapper id={id} color="#ff9900">
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      <div style={headerStyles}>
        <div style={{ ...iconStyles, background: '#ff9900' }}>⚙️</div>
        <div>
            <div style={{ fontSize: '10px', color: '#888' }}>ACTION</div>
            {data.label}
        </div>
      </div>
      {/* Input Field for the "Message" */}
      <input 
        className="nodrag" // Important: prevents dragging the node when typing
        type="text" 
        placeholder="Type message to log..." 
        style={inputStyles} 
        onChange={handleChange}
        defaultValue={data.message || ''}
      />
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </NodeWrapper>
  );
});

export const EndNode = memo(({ id, data }) => {
  return (
    <NodeWrapper id={id} color="#ff0072">
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      <div style={headerStyles}>
        <div style={{ ...iconStyles, background: '#ff0072' }}>🛑</div>
        <div>
          <div style={{ fontSize: '10px', color: '#888' }}>END</div>
          {data.label}
        </div>
      </div>
    </NodeWrapper>
  );
});