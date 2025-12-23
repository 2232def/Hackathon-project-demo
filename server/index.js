const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for dev
    methods: ["GET", "POST", "DELETE"]
  }
});

let activeWorkflows = {};

app.get('/', (req, res) => {
  res.send('Workflow Execution Engine is Running');
});

// DELETE route (Mock implementation)
app.delete('/node/:id', (req, res) => {
    const { id } = req.params;
    console.log(`[API] Request to delete node ${id}`);
    // In a real DB, we would delete it here.
    res.json({ success: true, message: `Node ${id} deleted` });
});

app.post('/execute', (req, res) => {
  const { nodes, edges } = req.body;
  const executionId = Date.now().toString();
  
  console.log(`[${executionId}] Workflow started.`);
  activeWorkflows[executionId] = { status: 'running', nodes };

  simulateExecution(executionId, nodes, edges);

  res.json({ success: true, executionId, message: "Workflow started" });
});

async function simulateExecution(executionId, nodes, edges) {
  // Sort nodes? For now, we just iterate the array. 
  // In a real app, we'd follow the edges.
  
  for (const node of nodes) {
    // 1. Notify: RUNNING
    io.emit('node-status', { executionId, nodeId: node.id, status: 'running' });
    
    // 2. Perform "Action" based on Node Type
    let logMessage = "";
    
    if (node.type === 'start') {
        logMessage = `[Trigger] Workflow started by ${node.data.label || 'User'}`;
    } else if (node.type === 'action') {
        // READ THE DATA FROM THE FRONTEND INPUT
        const userMessage = node.data.message || "Default Action";
        logMessage = `[Action] Processing: "${userMessage}"`;
        console.log(`[${executionId}] Action Node: ${userMessage}`);
    } else if (node.type === 'end') {
        logMessage = `[End] Workflow finished successfully.`;
    }

    // Emit the log to the frontend
    io.emit('execution-log', { executionId, message: logMessage, timestamp: new Date().toLocaleTimeString() });

    // Simulate work delay
    await new Promise(resolve => setTimeout(resolve, 4500));

    // 3. Notify: COMPLETED
    io.emit('node-status', { executionId, nodeId: node.id, status: 'completed' });
  }

  io.emit('workflow-status', { executionId, status: 'completed' });
}

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`SERVER running on http://localhost:${PORT}`);
});