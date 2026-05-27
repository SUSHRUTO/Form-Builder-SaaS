"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { SiteNav } from "~/components/site-nav";
import { trpc } from "~/trpc/client";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordInner />
    </Suspense>
  );
}

function ResetPasswordInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const reset = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      toast.success("Password changed. Login again with the new password.");
      router.push("/login");
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      <SiteNav />
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-lg items-center px-4 py-12">
        <form
          className="w-full rounded-md border border-white/10 bg-white/[0.07] p-6"
          onSubmit={(event) => {
            event.preventDefault();
            reset.mutate({ token, password });
          }}
        >
          <div className="grid size-11 place-items-center rounded-md bg-yellow-300 text-slate-950">
            <LockKeyhole className="size-5" />
          </div>
          <h1 className="mt-5 text-3xl font-semibold">Choose a new password</h1>
          <div className="mt-6">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2"
            />
          </div>
          <Button disabled={reset.isPending || !token} className="mt-6 w-full bg-yellow-300 text-slate-950 hover:bg-yellow-200">
            {reset.isPending ? "Saving..." : "Reset password"}
          </Button>
          <Link href="/login" className="mt-5 block text-sm text-slate-300 hover:text-white">
            Back to login
          </Link>
        </form>
      </section>
    </main>
  );
}
