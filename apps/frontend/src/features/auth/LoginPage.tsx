import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

import { authClient } from "../../lib/auth-client.ts";
import "../../styles/pages.css";

export function LoginPage() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (isPending) return null;
  if (session) return <Navigate to="/dashboard" replace />;

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
    <div style={{ maxWidth: 400, margin: "80px auto" }}>
      <h2 className="page-title">{t("signIn")}</h2>
      {error && (
        <div className="alert alert--error" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={(e) => void handleSubmit(e)}>
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            {t("email")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password" className="form-label">
            {t("password")}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
          />
        </div>
        <button type="submit" className="btn btn--primary">
          {t("signIn")}
        </button>
      </form>
      <p>
        {t("noAccount")} <Link to="/register">{t("signUp")}</Link>
      </p>
    </div>
  );
}
