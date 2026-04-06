import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

import { authClient } from "../../lib/auth-client.ts";

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
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: "0 16px" }}>
      <h2>{t("signUp")}</h2>
      {error && (
        <p role="alert" style={{ color: "#e54" }}>
          {error}
        </p>
      )}
      <form onSubmit={(e) => void handleSubmit(e)}>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="name">{t("name")}</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ display: "block", width: "100%" }}
          />
        </div>
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
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: "block", width: "100%" }}
          />
        </div>
        <button type="submit">{t("signUp")}</button>
      </form>
      <p>
        {t("hasAccount")} <Link to="/login">{t("signIn")}</Link>
      </p>
    </div>
  );
}
