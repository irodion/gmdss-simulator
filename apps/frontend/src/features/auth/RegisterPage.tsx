import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

import { authClient } from "../../lib/auth-client.ts";
import "../../styles/pages.css";

export function RegisterPage() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const result = await authClient.signUp.email({ name, email, password });
      if (result.error) {
        setError(result.error.message ?? t("emailTaken"));
      } else {
        void navigate("/learn");
      }
    } catch (err) {
      console.error("Registration failed:", err);
      setError(t("common:error"));
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "80px auto" }}>
      <h2 className="page-title">{t("signUp")}</h2>
      {error && (
        <div className="alert alert--error" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={(e) => void handleSubmit(e)}>
        <div className="form-group">
          <label htmlFor="name" className="form-label">
            {t("name")}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-input"
          />
        </div>
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
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
          />
        </div>
        <button type="submit" className="btn btn--primary">
          {t("signUp")}
        </button>
      </form>
      <p>
        {t("hasAccount")} <Link to="/login">{t("signIn")}</Link>
      </p>
    </div>
  );
}
