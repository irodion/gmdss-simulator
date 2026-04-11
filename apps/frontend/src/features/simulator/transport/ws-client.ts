/**
 * WebSocket client for the simulator AI voice loop.
 * Manages connection lifecycle, serialization, and reconnection.
 */

import type { ClientMessage, ServerMessage } from "./transport-types.ts";

export type WsStatus = "disconnected" | "connecting" | "connected" | "error";
export type MessageHandler = (msg: ServerMessage) => void;
export type StatusHandler = (status: WsStatus) => void;

export interface WsClientOptions {
  /** Base URL of the API server (e.g. "http://localhost:3001") */
  apiUrl: string;
  onMessage: MessageHandler;
  onStatusChange: StatusHandler;
}

export class WsClient {
  private ws: WebSocket | null = null;
  private opts: WsClientOptions;

  constructor(opts: WsClientOptions) {
    this.opts = opts;
  }

  /**
   * Open the WebSocket connection.
   */
  connect(): void {
    if (this.ws) return;

    this.opts.onStatusChange("connecting");

    // If apiUrl is empty, use same-origin WebSocket
    const base = this.opts.apiUrl || `${location.protocol}//${location.host}`;
    const wsUrl = base.replace(/^http/, "ws") + "/api/simulator/ws";
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.opts.onStatusChange("connected");
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(String(event.data)) as ServerMessage;
        this.opts.onMessage(msg);
      } catch {
        // Ignore unparseable messages
      }
    };

    this.ws.onclose = () => {
      this.ws = null;
      // No auto-reconnect: simulator sessions have server-side state that
      // cannot be recovered. The UI should show the disconnect and let the
      // user retry the scenario.
      this.opts.onStatusChange("disconnected");
    };

    this.ws.onerror = () => {
      this.opts.onStatusChange("error");
    };
  }

  /**
   * Send a message to the server.
   */
  send(msg: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.opts.onStatusChange("disconnected");
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
