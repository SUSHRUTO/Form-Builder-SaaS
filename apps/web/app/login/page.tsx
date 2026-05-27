"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Mail, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { SiteNav } from "~/components/site-nav";
import { trpc } from "~/trpc/client";

export default function LoginPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [email, setEmail] = useState("demo@pokebuilder.dev");
  const [password, setPassword] = useState("Pikachu@2026");
  const login = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("Welcome back to the trainer console.");
      router.push("/dashboard");
    },
    onError: (error) => toast.error(error.message),
  });
  const demoCredentials = {
    email: "demo@pokebuilder.dev",
    password: "Pikachu@2026",
  };

  function loginWithDemo() {
    setEmail(demoCredentials.email);
    setPassword(demoCredentials.password);
    login.mutate(demoCredentials);
  }

  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      <SiteNav />
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-yellow-200">Creator login</p>
          <h1 className="mt-4 text-4xl font-semibold sm:text-6xl">Enter the Pokecenter console.</h1>
          <p className="mt-5 leading-8 text-slate-300">
            Use the seeded demo credentials or create a fresh creator account. Sessions are stored in
            the database and delivered with secure HTTP-only cookies.
          </p>
          <div className="mt-6 grid gap-3 rounded-md border border-white/10 bg-white/[0.06] p-4 text-sm sm:grid-cols-2">
            <span className="font-mono text-yellow-100">demo@pokebuilder.dev</span>
            <span className="font-mono text-yellow-100">Pikachu@2026</span>
          </div>
          <Button
            type="button"
            disabled={login.isPending}
            className="mt-4 bg-yellow-300 text-slate-950 hover:bg-yellow-200"
            onClick={loginWithDemo}
          >
            <Sparkles className="size-4" />
            Open seeded demo
          </Button>
        </div>
        <form
          className="rounded-md border border-white/10 bg-white/[0.07] p-6 shadow-2xl"
          onSubmit={(event) => {
            event.preventDefault();
            login.mutate({ email, password });
          }}
        >
          <div className="grid size-11 place-items-center rounded-md bg-yellow-300 text-slate-950">
            <ShieldCheck className="size-5" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold">Login</h2>
          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <Button disabled={login.isPending} className="mt-6 w-full bg-yellow-300 text-slate-950 hover:bg-yellow-200">
            <Mail className="size-4" />
            {login.isPending ? "Opening console..." : "Login with email"}
          </Button>
          <div className="mt-5 flex items-center justify-between text-sm text-slate-300">
            <Link href="/forgot-password" className="hover:text-white">
              Forgot password?
            </Link>
            <Link href="/register" className="hover:text-white">
              Create account
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
