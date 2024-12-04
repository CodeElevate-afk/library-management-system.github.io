// preload.js

const { contextBridge, ipcRenderer } = require('electron');

// Exposing secure, limited functionality to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Example of a simple function to send a message to the main process
    sendMessage: (channel, data) => {
        // Only allowing specific channels to be used
        const validChannels = ['toMain'];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    
    // Function to receive messages from the main process
    receiveMessage: (channel, func) => {
        const validChannels = ['fromMain'];
        if (validChannels.includes(channel)) {
            // Strip event as it includes `sender` 
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    }
});
