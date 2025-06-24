import { FiAlertCircle } from "react-icons/fi";
import { BackButton } from "../components/common";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full text-center p-6">
      <FiAlertCircle className="text-6xl text-gray-400 mb-4" />
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Page Not Found</h1>
      <p className="text-gray-600 mb-6 max-w-md">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <BackButton text="Back to Home" to="/" />
    </div>
  );
}
