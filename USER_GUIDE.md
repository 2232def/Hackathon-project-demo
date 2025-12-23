# User Guide: Real-Time Workflow Designer

Welcome to the **Real-Time Workflow Management Platform**. This guide will help you create, manage, and execute automated business processes using our visual designer.

---

## 1. The Interface
When you open the application, you will see three main areas:
*   **The Sidebar (Left):** Your toolbox containing building blocks (Nodes).
*   **The Canvas (Top Right):** Your workspace to design processes.
*   **The Logs Console (Bottom Right):** A black terminal window that shows real-time feedback from the server.
*   **The Control Panel (Top Right):** Buttons to Save, Restore, and Run.

---

## 2. Creating Your First Workflow

### Step 1: Add a Trigger
1.  Drag the **⚡ Trigger** block from the left sidebar onto the canvas.
    *   *Role:* This starts the process (e.g., "New Order").

### Step 2: Add Actions & Custom Messages
1.  Drag an **⚙️ Action** block onto the canvas.
2.  **New Feature:** You will see a text box inside the node.
3.  Type a message, for example: *"Send Welcome Email to User"*.
    *   *What happens:* This text will be sent to the backend server when you run the workflow.

### Step 3: Connect the Dots
1.  Click and drag from the **bottom grey handle** of the Trigger to the **top handle** of the Action.
2.  Add a **🛑 End** node and connect the Action to it.

### Step 4: Deleting Nodes
*   If you make a mistake, click the small red **(x)** button in the top-right corner of any node to remove it.

---

## 3. Running & Monitoring

This is where the magic happens.

1.  Click the blue **▶ Run** button.
2.  **Watch the Canvas:**
    *   Nodes turn **Yellow** (Working) -> **Green** (Done).
3.  **Watch the Logs Console (Bottom):**
    *   You will see live messages appear as the server processes each step.
    *   *Example:* `[Action] Processing: "Send Welcome Email to User"`
    *   This confirms that your specific instructions were received and executed by the backend.

---

## 4. Technical Workflow (How it works under the hood)

When you click "Run", the following data flow occurs:

1.  **Serialization (Frontend):**
    *   React Flow converts your visual diagram (Nodes + Edges) into a JSON object.
    *   This includes the text you typed into the Action blocks.

2.  **Transmission (API):**
    *   The Frontend sends a `POST /execute` request to the Node.js Backend with this JSON.

3.  **Execution (Backend Engine):**
    *   The Server receives the JSON and starts a "Simulation Loop."
    *   It iterates through the nodes one by one.
    *   **Socket.io** is used to send two types of real-time updates back to the browser:
        *   `node-status`: Tells the node to change color (Yellow/Green).
        *   `execution-log`: Sends the text log (e.g., "Processing: [Your Message]") to the black console.

4.  **Completion:**
    *   Once the loop finishes, the Backend emits `workflow-status: completed`.

---

## 5. Saving Your Work
*   **💾 Save:** Saves the current layout to your browser's Local Storage.
*   **📂 Restore:** Reloads the last saved layout, even after you refresh the page.