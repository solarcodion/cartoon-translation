import { useEffect } from "react";
import { useTextBoxesActions } from "../stores/textBoxesStore";
import { websocketService } from "../services/websocketService";

/**
 * Hook to setup WebSocket listeners for all stores
 * Should be called once at the app level
 */
export const useWebSocketSetup = () => {
  const { setupWebSocketListeners, cleanupWebSocketListeners } = useTextBoxesActions();

  useEffect(() => {
    // Setup listeners for all stores
    setupWebSocketListeners();

    // Setup error handler for WebSocket errors
    const handleWebSocketError = (data: any) => {
      console.error("WebSocket error:", data);
      // You can add toast notifications or other error handling here
    };

    websocketService.onError(handleWebSocketError);

    // Cleanup on unmount
    return () => {
      cleanupWebSocketListeners();
      websocketService.offError(handleWebSocketError);
    };
  }, [setupWebSocketListeners, cleanupWebSocketListeners]);

  // Return connection status for debugging
  return {
    isConnected: websocketService.isConnected(),
  };
};
