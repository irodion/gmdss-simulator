import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";

import { authClient } from "../lib/auth-client.ts";
import { NAV_ITEMS } from "../lib/nav-items.ts";

export function NavSidebar() {
  const { t } = useTranslation();

  return (
    <nav className="nav-sidebar app-shell__sidebar" aria-label={t("nav.mainNavigation")}>
      <NavLink
        to="/dashboard"
        className="nav-block nav-block--logo"
        aria-label={t("nav.dashboard")}
      >
        G
      </NavLink>

      {NAV_ITEMS.map((item) =>
        item.disabled ? (
          <span key={item.to} className="nav-block nav-block--disabled" aria-disabled="true">
            <span className="nav-block__icon">{item.icon}</span>
            <span className="nav-block__label">{t(item.labelKey)}</span>
            {item.sub && <span className="nav-block__sub">{item.sub}</span>}
          </span>
        ) : (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-block${isActive ? " nav-block--active" : ""}`}
          >
            <span className="nav-block__icon">{item.icon}</span>
            <span className="nav-block__label">{t(item.labelKey)}</span>
          </NavLink>
        ),
      )}

      <div className="nav-sidebar__spacer" />

      <NavLink
        to="/progress"
        className={({ isActive }) => `nav-block${isActive ? " nav-block--active" : ""}`}
      >
        <span className="nav-block__icon">👤</span>
        <span className="nav-block__label">{t("nav.profile")}</span>
      </NavLink>

      <button type="button" className="signout-btn" onClick={() => void authClient.signOut()}>
        {t("signOut")}
      </button>
    </nav>
  );
}
