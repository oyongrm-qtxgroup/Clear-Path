import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

import { Sentry } from "@/lib/sentry";
import { queryClient } from "@/lib/queryClient";
import { router } from "@/router";

const isDev = import.meta.env.DEV;

function App() {
  return (
    <Sentry.ErrorBoundary
      fallback={<p className="p-6 text-center">Something went wrong.</p>}
    >
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <Toaster richColors position="top-right" />
          {isDev && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
      </ThemeProvider>
    </Sentry.ErrorBoundary>
  );
}

export default App;
