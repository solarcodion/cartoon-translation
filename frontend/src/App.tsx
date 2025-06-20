import { RouterProvider, createBrowserRouter } from "react-router-dom";
import routes from "./routes";

import "./App.css";

// Create router from the routes configuration
const router = createBrowserRouter(routes);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
