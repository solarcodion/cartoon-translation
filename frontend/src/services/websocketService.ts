import { supabase } from "../lib/supabase";

// Remove /api from the base URL for WebSocket connections
const WS_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace("http", "ws").replace(
    "/api",
    ""
  ) || "ws://localhost:8000";

export interface WebSocketMessage {
  type: string;
  data: any;
}

export interface AutoExtractCompletedData {
  chapter_id: string;
  page_id: string;
  text_boxes_count: number;
  page_number: number;
  timestamp: string;
}

export interface AutoExtractBatchCompletedData {
  chapter_id: string;
  total_pages: number;
  total_text_boxes: number;
  timestamp: string;
}

export interface ErrorData {
  error_type: string;
  message: string;
  context: any;
  timestamp: string;
}

export type WebSocketEventHandler = (data: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private userId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private eventHandlers: Map<string, WebSocketEventHandler[]> = new Map();
  private isConnecting = false;

  constructor() {
    this.setupAuthListener();
  }

  private setupAuthListener() {
    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user?.id) {
        this.connect(session.user.id);
      } else if (event === "SIGNED_OUT") {
        this.disconnect();
      }
    });
  }

  async connect(userId: string) {
    if (
      this.isConnecting ||
      (this.ws && this.ws.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    this.isConnecting = true;
    this.userId = userId;

    try {
      const wsUrl = `${WS_BASE_URL}/ws/${userId}`;
      console.log(`🔌 Connecting to WebSocket: ${wsUrl}`);

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("✅ WebSocket connected");
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.isConnecting = false;
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error("❌ Error parsing WebSocket message:", error);
        }
      };

      this.ws.onclose = (event) => {
        console.log("🔌 WebSocket disconnected:", event.code, event.reason);
        this.isConnecting = false;
        this.ws = null;

        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && this.userId) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
        this.isConnecting = false;
      };
    } catch (error) {
      console.error("❌ Error creating WebSocket connection:", error);
      this.isConnecting = false;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("❌ Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    console.log(
      `🔄 Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`
    );

    setTimeout(() => {
      if (this.userId) {
        this.connect(this.userId);
      }
    }, delay);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, "User disconnected");
      this.ws = null;
    }
    this.userId = null;
    this.reconnectAttempts = 0;
    this.isConnecting = false;
  }

  private handleMessage(message: WebSocketMessage) {
    console.log("📨 Received WebSocket message:", message);

    const handlers = this.eventHandlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message.data);
        } catch (error) {
          console.error(
            `❌ Error in WebSocket handler for ${message.type}:`,
            error
          );
        }
      });
    }
  }

  // Event subscription methods
  on(eventType: string, handler: WebSocketEventHandler) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  off(eventType: string, handler: WebSocketEventHandler) {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // Convenience methods for specific events
  onAutoExtractCompleted(handler: (data: AutoExtractCompletedData) => void) {
    this.on("auto_extract_completed", handler);
  }

  onAutoExtractBatchCompleted(
    handler: (data: AutoExtractBatchCompletedData) => void
  ) {
    this.on("auto_extract_batch_completed", handler);
  }

  onError(handler: (data: ErrorData) => void) {
    this.on("error", handler);
  }

  // Remove event listeners
  offAutoExtractCompleted(handler: (data: AutoExtractCompletedData) => void) {
    this.off("auto_extract_completed", handler);
  }

  offAutoExtractBatchCompleted(
    handler: (data: AutoExtractBatchCompletedData) => void
  ) {
    this.off("auto_extract_batch_completed", handler);
  }

  offError(handler: (data: ErrorData) => void) {
    this.off("error", handler);
  }

  // Get connection status
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  // Send a message (for keep-alive or other purposes)
  send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
