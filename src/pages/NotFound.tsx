import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

// 404 page (route: catch-all "*") — shown for any unmatched URL.

/**
 * NotFound page: renders a 404 message with a link home, and logs the attempted
 * (unmatched) pathname to the console for debugging.
 */
const NotFound = () => {
  const location = useLocation();

  // Log the missing route whenever the path changes.
  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <Link to="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
