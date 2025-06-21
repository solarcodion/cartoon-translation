import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

export default function Auth() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">ManhwaTrans</h2>
          <p className="text-gray-600">Manhwa Translation Admin Panel</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm rounded-lg sm:px-10">
          <SupabaseAuth
            supabaseClient={supabase}
            view="sign_in"
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: "#3b82f6",
                    brandAccent: "#2563eb",
                    brandButtonText: "white",
                    defaultButtonBackground: "#f3f4f6",
                    defaultButtonBackgroundHover: "#e5e7eb",
                  },
                },
              },
              className: {
                container: "w-full",
                button:
                  "w-full px-4 py-2 rounded-md font-medium transition-colors",
                input:
                  "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                label: "block text-sm font-medium text-gray-700 mb-1",
              },
            }}
            providers={["google", "github"]}
            redirectTo={`${window.location.origin}/`}
            onlyThirdPartyProviders={false}
            magicLink={false}
            showLinks={true}
            localization={{
              variables: {
                sign_in: {
                  email_label: "Email address",
                  password_label: "Password",
                  button_label: "Sign in",
                  link_text: "Don't have an account? Sign up",
                  loading_button_label: "Signing in...",
                },
                sign_up: {
                  email_label: "Email address",
                  password_label: "Create a password",
                  button_label: "Create account",
                  link_text: "Already have an account? Sign in",
                  loading_button_label: "Creating account...",
                  confirmation_text:
                    "Check your email for the confirmation link",
                },
                forgotten_password: {
                  email_label: "Email address",
                  button_label: "Send reset instructions",
                  link_text: "Forgot your password?",
                  loading_button_label: "Sending...",
                  confirmation_text:
                    "Check your email for the password reset link",
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
