"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { SiteNav } from "~/components/site-nav";
import { trpc } from "~/trpc/client";

export default function RegisterPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const register = trpc.auth.register.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("Your creator console is ready.");
      router.push("/dashboard");
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      <SiteNav />
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-yellow-200">Start free</p>
          <h1 className="mt-4 text-4xl font-semibold sm:text-6xl">Claim your region and build.</h1>
          <p className="mt-5 leading-8 text-slate-300">
            Create forms with dynamic fields, publish public gallery experiences or hide unlisted links
            for invite-only trainer groups.
          </p>
        </div>
        <form
          className="rounded-md border border-white/10 bg-white/[0.07] p-6"
          onSubmit={(event) => {
            event.preventDefault();
            register.mutate({ fullName, email, password });
          }}
        >
          <div className="grid size-11 place-items-center rounded-md bg-yellow-300 text-slate-950">
            <Sparkles className="size-5" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold">Create account</h2>
          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-2" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <Button disabled={register.isPending} className="mt-6 w-full bg-yellow-300 text-slate-950 hover:bg-yellow-200">
            {register.isPending ? "Creating..." : "Create creator account"}
          </Button>
          <p className="mt-5 text-sm text-slate-300">
            Already have an account?{" "}
            <Link href="/login" className="text-yellow-100 hover:text-white">
              Login
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
