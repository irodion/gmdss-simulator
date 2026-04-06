import { Navigate } from "react-router";
import type { ReactNode } from "react";

import { authClient } from "../lib/auth-client.ts";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <div>Loading...</div>;
  if (!session) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
