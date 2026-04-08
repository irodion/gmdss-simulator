import { Outlet } from "react-router";

import "../styles/shell.css";
import { authClient } from "../lib/auth-client.ts";
import { TopBar } from "./TopBar.tsx";
import { NavSidebar } from "./NavSidebar.tsx";
import { BottomTabBar } from "./BottomTabBar.tsx";

export function Layout() {
  const { data: session } = authClient.useSession();

  return (
    <div className={`app-shell${session ? "" : " app-shell--no-sidebar"}`}>
      <TopBar />
      {session && <NavSidebar />}
      <main className="app-shell__main">
        <Outlet />
      </main>
      {session && <BottomTabBar />}
    </div>
  );
}
