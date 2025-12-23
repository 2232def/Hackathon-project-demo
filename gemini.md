# Gemini Context: Real-Time Workflow Management Platform

## Project Overview
This project is a **Real-Time Workflow Management Platform** (also referred to as a "Digital Assembly Line"). It enables users to visually design, execute, and monitor automated business processes without writing code.

**Key Value Proposition:**
- **Visual Design:** Drag-and-drop interface for creating workflows (Trigger -> Action -> End).
- **Execution Engine:** Backend system that interprets and runs the visual diagrams.
- **Real-Time Feedback:** Instant status updates (Yellow/Green nodes) and live execution logs via WebSockets.
- **Target Audience:** Operations managers (automating repetitive tasks) and DevOps engineers (orchestrating scripts).

---

## Technical Architecture

### 1. Frontend (`/client`)
- **Framework:** React (Vite)
- **Core Library:** `@xyflow/react` (React Flow) for the interactive canvas.
- **State Management:** `useState`, `useNodesState`, `useEdgesState` (React Flow hooks).
- **Communication:**
    - `axios` for HTTP requests (start execution).
    - `socket.io-client` for receiving real-time updates (`node-status`, `execution-log`).
- **Key Components:**
    - `App.jsx`: Main layout, canvas rendering, socket listeners, and control logic (Run, Save, Restore).
    - `CustomNodes.jsx`: Custom UI for `Trigger`, `Action`, and `End` nodes, including input fields for user messages.

### 2. Backend (`/server`)
- **Runtime:** Node.js
- **Framework:** Express.js
- **Real-Time:** `socket.io`
- **Core Logic (`index.js`):**
    - **`POST /execute`**: Receives the workflow JSON (nodes & edges).
    - **`simulateExecution()`**: Iterates through the nodes, simulating work (using `setTimeout`), and emitting events via Socket.io.
    - **Events Emitted:**
        - `node-status`: Updates node color (running/completed).
        - `execution-log`: Sends descriptive text logs to the frontend console.
        - `workflow-status`: Notifies when the entire workflow is finished.

### 3. Data Flow
1.  **Design:** User draws a workflow in the React frontend.
2.  **Trigger:** User clicks "Run". The frontend sends the node/edge data to `POST /execute`.
3.  **Process:** The Node.js server starts a "simulation loop".
4.  **Feedback:** The server pushes updates to the client via WebSockets as it processes each node.
5.  **Visual Update:** The React Flow canvas updates node styles (colors) and the log console displays messages in real-time.

---

## Current Status & Features (Phase 1)
- **Canvas:** Drag-and-drop enabled, custom node types (Start, Action, End).
- **Configuration:** "Action" nodes have input fields to define custom log messages.
- **Persistence:** Save and Restore functionality using browser `localStorage`.
- **Execution:** Sequential simulation of nodes with artificial delays to demonstrate real-time tracking.
- **Logging:** dedicated "Logs Console" in the UI for live feedback.

## Roadmap (Future / GenAI Integration)
- **Generative AI:** Planned integration (Gemini 1.5 Pro) to allow "Text-to-Workflow" creation. Users will describe a process in natural language, and the system will generate the corresponding node/edge JSON.
- **Intelligent Nodes:** "AI Agent" nodes that can perform sentiment analysis or data extraction.
- **Error Diagnosis:** AI-powered analysis of failure logs to suggest fixes.

---

## Quick Start
1.  **Server:** `cd server && npm install && node index.js` (Runs on port 3001)
2.  **Client:** `cd client && npm install && npm run dev` (Runs on Vite default port)
