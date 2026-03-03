// src/api/wsClient.ts
import { getConfig } from '../config';

export interface OperationMessage {
    opId: string;
    opType: string; // 'copy' | 'move' | 'delete' | 'rename'
    opName?: string | null; // e.g. "Copying file name to destination"
    opStatus: string; // 'queued' | 'starting' | 'in-progress' | 'completed' | 'error'
    opPercentage?: number | null;
    opSpeed?: string | null;
    opFileCount?: string | null;
    error?: string | null;
    destDir?: string | null;
}

type WsCallback = (data: OperationMessage) => void;

class WebSocketClient {
    private socket: WebSocket | null = null;
    private reconnectTimeout = 5000;
    private listeners: WsCallback[] = [];
    private statusListeners: ((connected: boolean) => void)[] = [];
    private isReconnecting = false;
    private _isConnected = false;

    private get url() {
        return getConfig().wsUrl;
    }

    public subscribeStatus(callback: (connected: boolean) => void) {
        this.statusListeners.push(callback);
        callback(this._isConnected);
        return () => {
            this.statusListeners = this.statusListeners.filter(cb => cb !== callback);
        };
    }

    private updateStatus(connected: boolean) {
        if (this._isConnected !== connected) {
            this._isConnected = connected;
            this.statusListeners.forEach(cb => { cb(connected); });
        }
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
            this.updateStatus(true);
            if (this.isReconnecting) {
                // Trigger a custom event or let the status listener handle it.
                // We'll dispatch a custom event on window for the successful reconnect.
                window.dispatchEvent(new CustomEvent('ws-reconnected'));
                this.isReconnecting = false;
            }
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
            this.updateStatus(false);
            this.isReconnecting = true;
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
