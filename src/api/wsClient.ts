// src/api/wsClient.ts

export interface OperationMessage {
    opId: string;
    opType: string; // 'copy' | 'move' | 'delete' | 'rename'
    opStatus: string; // 'queued' | 'starting' | 'in-progress' | 'completed' | 'error'
    opPercentage?: number | null;
    opSpeed?: string | null;
    opFileCount?: string | null;
    error?: string | null;
}

type WsCallback = (data: OperationMessage) => void;

class WebSocketClient {
    private socket: WebSocket | null = null;
    private url: string;
    private reconnectTimeout = 5000;
    private listeners: WsCallback[] = [];

    constructor() {
        const hostname = window.location.hostname;
        const PORT = "30333";
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

        // Match the logic in axiosLayer.tsx
        const isLocal = import.meta.env.VITE_BUILD_PROFILE === "local";
        const wsPort = isLocal ? "3333" : PORT;
        const wsHost = isLocal ? "localhost" : hostname;

        this.url = `${protocol}//${wsHost}:${wsPort}/ws`;
    }

    public subscribe(callback: WsCallback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    public connect() {
        if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
            return;
        }

        console.log(`[WebSocket] Connecting to ${this.url}...`);
        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
            console.log('[WebSocket] Connected');
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(String(event.data)) as OperationMessage;
                console.log('[WebSocket] Received:', data);
                this.listeners.forEach(cb => { cb(data); });
            } catch {
                console.log('[WebSocket] Received (raw):', event.data);
            }
        };

        this.socket.onclose = () => {
            console.log(`[WebSocket] Disconnected. Reconnecting in ${this.reconnectTimeout / 1000}s...`);
            setTimeout(() => { this.connect(); }, this.reconnectTimeout);
        };

        this.socket.onerror = (error) => {
            console.error('[WebSocket] Error:', error);
            this.socket?.close();
        };
    }

    public send(data: any) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        } else {
            console.error('[WebSocket] Cannot send message, socket not connected');
        }
    }
}

export const wsClient = new WebSocketClient();
