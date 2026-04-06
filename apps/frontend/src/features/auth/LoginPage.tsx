import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

import { authClient } from "../../lib/auth-client.ts";

export function LoginPage() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const result = await authClient.signIn.email({ email, password });
    if (result.error) {
      setError(result.error.message ?? t("invalidCredentials"));
    } else {
      void navigate("/learn");
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: "0 16px" }}>
      <h2>{t("signIn")}</h2>
      {error && (
        <p role="alert" style={{ color: "#e54" }}>
          {error}
        </p>
      )}
      <form onSubmit={(e) => void handleSubmit(e)}>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="email">{t("email")}</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ display: "block", width: "100%" }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="password">{t("password")}</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: "block", width: "100%" }}
          />
        </div>
        <button type="submit">{t("signIn")}</button>
      </form>
      <p>
        {t("noAccount")} <Link to="/register">{t("signUp")}</Link>
      </p>
    </div>
  );
}
