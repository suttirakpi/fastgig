import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { RegisterInput } from "../lib/auth";

const empty: RegisterInput = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  age: "",
  skill: "",
};

export default function Register() {
  const { user, loading, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<RegisterInput>(empty);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  const set =
    (key: keyof RegisterInput) => (e: ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(form);
      navigate("/", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell auth-shell">
      <Logo />
      <form className="form" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            className="input"
            placeholder="Create Your User name"
            value={form.username}
            onChange={set("username")}
            required
            minLength={3}
          />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            type="email"
            placeholder="Create Your Email"
            value={form.email}
            onChange={set("email")}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            className="input"
            type="password"
            placeholder="อย่างน้อย 8 ตัวอักษร"
            value={form.password}
            onChange={set("password")}
            required
            minLength={8}
          />
        </div>
        <div className="field">
          <label htmlFor="confirm">Confirm Password</label>
          <input
            id="confirm"
            className="input"
            type="password"
            placeholder="Confirm Your Password"
            value={form.confirmPassword}
            onChange={set("confirmPassword")}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="phone">Phone</label>
          <input
            id="phone"
            className="input"
            inputMode="tel"
            placeholder="Enter Your Phone Number"
            value={form.phone}
            onChange={set("phone")}
          />
        </div>
        <div className="field">
          <label htmlFor="age">Age</label>
          <input
            id="age"
            className="input"
            type="number"
            min={15}
            max={100}
            placeholder="Enter Your Age"
            value={form.age}
            onChange={set("age")}
          />
        </div>
        <div className="field">
          <label htmlFor="skill">Skill</label>
          <input
            id="skill"
            className="input"
            placeholder="เช่น ทำความสะอาด, ขนของ, ทำอาหาร"
            value={form.skill}
            onChange={set("skill")}
          />
        </div>
        {error && <div className="alert">{error}</div>}
        <button className="btn btn-block" disabled={busy}>
          {busy ? "กำลังสมัคร..." : "Continue"}
        </button>
      </form>
      <p className="auth-switch">
        Do You Have Account? <Link to="/login">Sign In</Link>
      </p>
    </div>
  );
}
