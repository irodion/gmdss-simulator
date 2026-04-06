import { useEffect } from "react";

import "./i18n/index.ts";
import { startSyncListener } from "./lib/sync.ts";
import { AppRouter } from "./router.tsx";

export function App() {
  useEffect(() => startSyncListener(), []);

  return <AppRouter />;
}
