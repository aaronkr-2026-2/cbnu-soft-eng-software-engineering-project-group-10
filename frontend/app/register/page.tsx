"use client";

import { Suspense, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, IdCard, LockKeyhole, Mail, UserRound } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { apiError, register } from "@/services/api.service";
import { validateSignup, type SignupFields } from "@/lib/signup-validation";

const inputs = [
  { key: "full_name", label: "Full name", autoComplete: "name", placeholder: "Your full name", maxLength: 100, Icon: UserRound },
  { key: "student_number", label: "Student number", autoComplete: "off", placeholder: "Your student number", maxLength: 50, Icon: IdCard },
  { key: "email", label: "University email", autoComplete: "email", placeholder: "yourname@university.ac.kr", maxLength: 254, Icon: Mail },
  { key: "password", label: "Password", autoComplete: "new-password", placeholder: "12-128 characters", maxLength: 128, Icon: LockKeyhole },
] as const;

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<SignupFields>({ full_name: "", student_number: "", email: "", password: "", agree: false });
  const [touched, setTouched] = useState<Partial<Record<keyof SignupFields, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const errors = validateSignup(fields);
  const visibleError = (key: keyof SignupFields) => (submitted || touched[key]) ? errors[key] : undefined;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    const firstInvalid = (Object.keys(errors) as (keyof SignupFields)[])[0];
    if (firstInvalid) {
      document.getElementById(`register-${firstInvalid}`)?.focus();
      return;
    }
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await register({ full_name: fields.full_name.trim(), student_number: fields.student_number.trim(), email: fields.email.trim().toLowerCase(), password: fields.password });
      const next = params.get("next") || "/my-posts";
      router.replace(`/login?registered=1&next=${encodeURIComponent(next)}`);
    } catch (cause) { setError(apiError(cause)); }
    finally { pending.current = false; setBusy(false); }

  }

  return <AuthShell mode="register" title="Create your account." description="One account. One campus community. More lost items finding their way home.">
    <form noValidate onSubmit={submit} className="mt-8 space-y-5">
      {inputs.map(({ key, label, autoComplete, placeholder, maxLength, Icon }) => {
        const error = visibleError(key);
        const id = `register-${key}`;
        const isPassword = key === "password";
        return <div key={key}>
          <label htmlFor={id} className="label-base">{label}</label>
          <div className="relative">
            <Icon size={18} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input id={id} name={key} autoComplete={autoComplete} required maxLength={maxLength}
              minLength={isPassword ? 12 : undefined}
              type={isPassword ? (showPassword ? "text" : "password") : key === "email" ? "email" : "text"}
              value={fields[key]} placeholder={placeholder}
              aria-invalid={Boolean(error)}
              aria-describedby={[isPassword ? "register-password-hint" : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined}
              onChange={event => setFields(current => ({ ...current, [key]: event.target.value }))}
              onBlur={() => setTouched(current => ({ ...current, [key]: true }))}
              className={`input-base !pl-12 ${isPassword ? "!pr-12" : ""} ${error ? "border-rose-500" : ""}`} />
            {isPassword && <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}
              onClick={() => setShowPassword(current => !current)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:text-blue-600 focus-visible:outline-2 focus-visible:outline-blue-600">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>}
          </div>
          {isPassword && <p id="register-password-hint" className="mt-2 text-xs text-slate-500">Use 12-128 characters.</p>}
          {error && <p id={`${id}-error`} aria-live="polite" className="mt-2 text-sm text-rose-700">{error}</p>}
        </div>;
      })}
      <div>
        <label className="flex cursor-pointer items-start gap-3 text-xs leading-6 text-slate-500">
          <input id="register-agree" name="agree" required type="checkbox" checked={fields.agree}
            aria-invalid={Boolean(visibleError("agree"))} aria-describedby={visibleError("agree") ? "register-agree-error" : undefined}
            onChange={event => setFields(current => ({ ...current, agree: event.target.checked }))}
            onBlur={() => setTouched(current => ({ ...current, agree: true }))}
            className="mt-1 h-4 w-4 shrink-0 accent-blue-600" />
          I agree to use CampusFind responsibly and keep sensitive personal information out of public posts.
        </label>
        {visibleError("agree") && <p id="register-agree-error" aria-live="polite" className="mt-2 text-sm text-rose-700">{visibleError("agree")}</p>}
      </div>
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      <button disabled={busy} aria-busy={busy} className="btn-primary !py-3.5 w-full" type="submit">{busy ? "Creating account..." : "Create account"} <ArrowRight size={18} /></button>
      <p className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-xs leading-6 text-amber-800">After registration, sign in with your email and password. Email ownership and student status are not verified yet.</p>
    </form>
  </AuthShell>;
}

export default function RegisterPage() {
  return <Suspense fallback={<div className="container-page py-24">Loading...</div>}><RegisterForm /></Suspense>;
}
