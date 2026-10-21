import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./features/auth/AuthProvider.jsx";
import ModalProvider from "./components/modal/ModalProvider";
import ProfileProvider from "./features/profiles/useProfile";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, //1 min baseline,
      retry: 1,
      // refetchOnWindowFocus + refetchOnReconnect stay TRUE (defaults) —
      // this is  cross-device sync path. Do NOT disable them.
    },
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ProfileProvider>
          <ModalProvider>
            <App />
            <Toaster
              richColors
              position="top-center"
              toastOptions={{ className: "font-sans" }}
            />
          </ModalProvider>
        </ProfileProvider>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
);
