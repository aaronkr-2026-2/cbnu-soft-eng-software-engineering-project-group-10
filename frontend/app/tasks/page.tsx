"use client";

import { useState, type FormEvent } from "react";
import { apiError, fetchTasks, getAccount, login, logout, type Task } from "@/services/api.service";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    let issuedToken = "";
    try {
      const result = await login(email.trim(), password);
      issuedToken = result.access_token;
      const [account, records] = await Promise.all([getAccount(issuedToken), fetchTasks()]);
      setName(account.full_name);
      setTasks(records);
      setToken(issuedToken);
      setPassword("");
    } catch (cause) {
      if (issuedToken) await logout(issuedToken).catch(() => undefined);
      setError(apiError(cause));
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    setError("");
    try {
      await logout(token);
      setToken("");
      setTasks([]);
      setName("");
    } catch (cause) {
      setError(apiError(cause));
    } finally {
      setBusy(false);
    }
  }

  return <div className="container-page max-w-2xl py-12">
    <h1 className="text-3xl font-bold">Backend tasks demo</h1>
    <p className="my-4 text-sm text-slate-600">This page uses the PostgreSQL account API. The CampusFind listing pages still use a separate browser-local demo session. Create a backend account through POST /auth/register before signing in here.</p>
    {!token ? <form onSubmit={signIn} className="card-base space-y-5 p-6">
      <div><label htmlFor="task-email" className="label-base">Email</label><input id="task-email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} className="input-base" /></div>
      <div><label htmlFor="task-password" className="label-base">Password</label><input id="task-password" type="password" autoComplete="current-password" required minLength={12} maxLength={128} value={password} onChange={event => setPassword(event.target.value)} className="input-base" /></div>
      <button disabled={busy} className="btn-primary">{busy ? "Signing in..." : "Sign in"}</button>
    </form> : <div className="space-y-4">
      <div className="flex items-center justify-between"><p>Welcome {name}</p><button disabled={busy} onClick={signOut} className="btn-secondary">Log out</button></div>
      {tasks.map(task => <div key={task.id} className="card-base flex justify-between gap-4 p-4"><span>{task.title}</span><span>{task.isCompleted ? "Done" : "Pending"}</span></div>)}
    </div>}
    {error && <p role="alert" className="mt-4 text-sm text-rose-700">{error}</p>}
  </div>;
}
