"use client";

import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";

export function AuthScreen() {
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      const result =
        mode === "signUp"
          ? await authClient.signUp.email({ name: name.trim(), email: email.trim(), password })
          : await authClient.signIn.email({ email: email.trim(), password });

      if (result.error) {
        setError(result.error.message ?? "We couldn't sign you in. Check your details and try again.");
      }
    } catch {
      setError("We couldn't reach the account service. Check your MongoDB connection and try again.");
    } finally {
      setPending(false);
    }
  }

  function changeMode(nextMode: "signIn" | "signUp") {
    setError("");
    setMode(nextMode);
  }

  return (
    <main className="auth-shell">
      <section className="auth-story">
        <a className="brand auth-brand" href="#" aria-label="Daymark home">
          <span className="brand-mark"><Sparkles size={17} strokeWidth={2.3} /></span>
          <span>daymark<span className="brand-period">.</span></span>
        </a>
        <div className="auth-story-copy">
          <span className="auth-eyebrow"><span /> YOUR NEXT CHAPTER STARTS HERE</span>
          <h1>A calmer way to<br />find your next <em>yes.</em></h1>
          <p>Keep the details in one place, make space for the good conversations, and take your job search one step at a time.</p>
          <div className="auth-benefits">
            <span><Check size={15} /> Every application, thoughtfully organized</span>
            <span><Check size={15} /> Your contacts and next steps, close at hand</span>
            <span><LockKeyhole size={14} /> Your account. Your private workspace.</span>
          </div>
        </div>
        <div className="auth-story-footer"><span>Made for the in-between.</span><span>One step at a time.</span></div>
        <span className="auth-decoration auth-decoration-one" />
        <span className="auth-decoration auth-decoration-two" />
      </section>

      <section className="auth-form-side">
        <div className="auth-form-wrap">
          <div className="auth-welcome">
            <span className="auth-welcome-icon"><Sparkles size={16} /></span>
            <span>Welcome {mode === "signIn" ? "back" : "to your next chapter"}</span>
          </div>
          <h2>{mode === "signIn" ? "Good to see you." : "Make it yours."}</h2>
          <p className="auth-description">{mode === "signIn" ? "Sign in to pick up where you left off." : "Create your private space for the opportunities ahead."}</p>

          <div className="auth-mode-switch" role="tablist" aria-label="Account action">
            <button type="button" role="tab" aria-selected={mode === "signIn"} className={mode === "signIn" ? "auth-tab active" : "auth-tab"} onClick={() => changeMode("signIn")}>Sign in</button>
            <button type="button" role="tab" aria-selected={mode === "signUp"} className={mode === "signUp" ? "auth-tab active" : "auth-tab"} onClick={() => changeMode("signUp")}>Create account</button>
          </div>

          <form className="auth-form" onSubmit={submit}>
            {mode === "signUp" && (
              <label className="auth-field">
                <span>Your name</span>
                <div className="auth-input-wrap"><input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Jordan Davis" required minLength={1} maxLength={100} /></div>
              </label>
            )}
            <label className="auth-field">
              <span>Email address</span>
              <div className="auth-input-wrap"><Mail size={16} /><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required maxLength={254} /></div>
            </label>
            <label className="auth-field">
              <span>Password <small>{mode === "signUp" ? "At least 12 characters" : ""}</small></span>
              <div className="auth-input-wrap"><LockKeyhole size={16} /><input type={showPassword ? "text" : "password"} autoComplete={mode === "signUp" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "signUp" ? "Create a strong password" : "Enter your password"} required minLength={mode === "signUp" ? 12 : 1} maxLength={128} /><button className="password-toggle" type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
            </label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="auth-submit" type="submit" disabled={pending}>
              {pending ? "One moment..." : mode === "signIn" ? "Sign in to Daymark" : "Create my account"}
              {!pending && <ArrowRight size={16} />}
            </button>
          </form>

          <p className="auth-privacy"><LockKeyhole size={13} /> Your applications are private to your account.</p>
          <p className="auth-switch-copy">{mode === "signIn" ? "New around here?" : "Already have an account?"}{" "}
            <button type="button" onClick={() => changeMode(mode === "signIn" ? "signUp" : "signIn")}>{mode === "signIn" ? "Create an account" : "Sign in"}</button>
          </p>
        </div>
      </section>
    </main>
  );
}
