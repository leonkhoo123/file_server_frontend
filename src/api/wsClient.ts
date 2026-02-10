// src/api/wsClient.ts

class WebSocketClient {
    private socket: WebSocket | null = null;
    private url: string;
    private reconnectTimeout: number = 5000;

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
                const data = JSON.parse(event.data);
                console.log('[WebSocket] Received:', data);
            } catch (error) {
                console.log('[WebSocket] Received (raw):', event.data);
            }
        };

        this.socket.onclose = () => {
            console.log(`[WebSocket] Disconnected. Reconnecting in ${this.reconnectTimeout / 1000}s...`);
            setTimeout(() => this.connect(), this.reconnectTimeout);
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
