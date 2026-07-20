"use client";

import { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
      <h1 className="mb-2 text-3xl font-bold">
        WorkshopOS
      </h1>

      <p className="mb-8 text-slate-500">
        Sign in to continue
      </p>

      <form className="space-y-5">

        <div>
          <label className="mb-2 block text-sm font-medium">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-slate-900 py-3 font-medium text-white hover:bg-slate-800"
        >
          Sign In
        </button>

      </form>
    </div>
  );
}