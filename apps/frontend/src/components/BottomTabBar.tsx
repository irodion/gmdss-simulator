import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";

import { authClient } from "../lib/auth-client.ts";
import { NAV_ITEMS } from "../lib/nav-items.ts";

export function BottomTabBar() {
  const { t } = useTranslation();

  const tabs = [
    { to: "/dashboard", label: t("nav.dashboard"), icon: "🏠", disabled: undefined },
    ...NAV_ITEMS.map((item) => ({
      to: item.to,
      label: t(item.labelKey),
      icon: item.icon,
      disabled: item.disabled,
    })),
    { to: "/progress", label: t("nav.profile"), icon: "👤", disabled: undefined },
  ];

  return (
    <nav className="bottom-tabs app-shell__bottom-tabs" aria-label="Main navigation">
      {tabs.map((tab) =>
        tab.disabled ? (
          <span key={tab.to} className="bottom-tab bottom-tab--disabled" aria-disabled="true">
            <span className="bottom-tab__icon">{tab.icon}</span>
            {tab.label}
          </span>
        ) : (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => `bottom-tab${isActive ? " bottom-tab--active" : ""}`}
          >
            <span className="bottom-tab__icon">{tab.icon}</span>
            {tab.label}
          </NavLink>
        ),
      )}
      <button
        type="button"
        className="bottom-tab"
        onClick={() => void authClient.signOut()}
        aria-label={t("signOut")}
      >
        <span className="bottom-tab__icon">🚪</span>
        {t("signOut")}
      </button>
    </nav>
  );
}
