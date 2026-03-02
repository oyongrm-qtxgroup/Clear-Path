import { Link } from "react-router-dom";
import { withErrorBoundary } from "@/components/common";

function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-muted-foreground text-lg">Page not found</p>
      <Link to="/" className="text-primary underline underline-offset-4">
        Go back home
      </Link>
    </div>
  );
}

export default withErrorBoundary(NotFoundPage, "Page Not Found");
