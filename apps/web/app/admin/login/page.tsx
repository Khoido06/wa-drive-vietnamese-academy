"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);
    if (!res.ok) {
      setError("Mật khẩu không đúng");
      return;
    }
    router.push("/admin");
  };

  return (
    <main className="admin-page">
      <h1>Admin</h1>
      <p className="admin-subtitle">WA Drive Vietnamese Academy</p>
      <form onSubmit={submit} className="admin-login-form">
        <label htmlFor="admin-password">Mật khẩu quản trị</label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        {error && <p className="admin-error">{error}</p>}
        <button type="submit" disabled={loading || !password}>
          {loading ? "Đang vào..." : "Đăng nhập"}
        </button>
      </form>
    </main>
  );
}
