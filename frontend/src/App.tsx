import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { AuthProvider } from "./providers/AuthProvider";
import { useWebSocketSetup } from "./hooks/useWebSocketSetup";
import routes from "./routes";

// Create router from the routes configuration
const router = createBrowserRouter(routes);

function App() {
  // Setup WebSocket listeners for real-time updates
  useWebSocketSetup();

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
