const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("voxcpmShell", {
  onStatus(callback) {
    ipcRenderer.on("status", (_event, payload) => callback(payload));
  },
  getShellState() {
    return ipcRenderer.invoke("get-shell-state");
  },
  listVoices(payload = {}) {
    return ipcRenderer.invoke("app-service", { action: "list-voices", payload });
  },
  createVoice(payload) {
    return ipcRenderer.invoke("app-service", { action: "create-voice", payload });
  },
  updateVoice(payload) {
    return ipcRenderer.invoke("app-service", { action: "update-voice", payload });
  },
  deleteVoice(payload) {
    return ipcRenderer.invoke("app-service", { action: "delete-voice", payload });
  },
  listGenerations(payload = {}) {
    return ipcRenderer.invoke("app-service", { action: "list-generations", payload });
  },
  createGeneration(payload) {
    return ipcRenderer.invoke("app-service", { action: "create-generation", payload });
  },
  markGenerationRunning(payload) {
    return ipcRenderer.invoke("app-service", { action: "mark-generation-running", payload });
  },
  markGenerationSucceeded(payload) {
    return ipcRenderer.invoke("app-service", { action: "mark-generation-succeeded", payload });
  },
  markGenerationFailed(payload) {
    return ipcRenderer.invoke("app-service", { action: "mark-generation-failed", payload });
  },
  deleteGeneration(payload) {
    return ipcRenderer.invoke("app-service", { action: "delete-generation", payload });
  },
});
