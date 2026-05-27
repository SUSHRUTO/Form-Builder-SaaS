import Link from "next/link";
import { Check, Zap } from "lucide-react";
import { Button } from "~/components/ui/button";
import { SiteNav } from "~/components/site-nav";

const plans = [
  {
    name: "Trainer",
    price: "$0",
    copy: "For solo hackathon judges and first forms.",
    features: ["3 published forms", "100 responses", "Pokemon theme gallery", "CSV export"],
  },
  {
    name: "Gym Leader",
    price: "$19",
    copy: "For creators shipping polished public funnels.",
    featured: true,
    features: ["Unlimited forms", "Public and unlisted links", "Password forms", "Email notifications", "API access"],
  },
  {
    name: "Champion",
    price: "$49",
    copy: "For teams running campaigns and communities.",
    features: ["Admin dashboard", "Advanced analytics", "Custom domains", "Priority support"],
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      <SiteNav />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-yellow-200">Pricing</p>
          <h1 className="mt-4 text-4xl font-semibold sm:text-6xl">Plans for every trainer league.</h1>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Payment wiring is intentionally mocked for the demo, but the page reflects a production SaaS
            packaging model.
          </p>
          <div className="mt-6 grid gap-3 rounded-md border border-yellow-300/30 bg-yellow-300/10 p-4 text-sm text-yellow-50 sm:grid-cols-3">
            <span>1. Login with demo access</span>
            <span>2. Generate Ash journey forms</span>
            <span>3. Publish public or unlisted links</span>
          </div>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`rounded-md border p-6 ${
                plan.featured
                  ? "border-yellow-300/60 bg-yellow-300 text-slate-950"
                  : "border-white/10 bg-white/[0.06]"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold">{plan.name}</h2>
                {plan.featured ? <Zap className="size-5" /> : null}
              </div>
              <p className={`mt-3 ${plan.featured ? "text-slate-800" : "text-slate-300"}`}>{plan.copy}</p>
              <p className="mt-6 text-5xl font-semibold">
                {plan.price}
                <span className="text-base font-normal"> /mo</span>
              </p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm">
                    <Check className="size-4" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className={`mt-8 w-full ${
                  plan.featured ? "bg-slate-950 text-white hover:bg-slate-800" : "bg-yellow-300 text-slate-950 hover:bg-yellow-200"
                }`}
              >
                <Link href="/login">Choose {plan.name}</Link>
              </Button>
            </article>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild className="bg-yellow-300 text-slate-950 hover:bg-yellow-200">
            <Link href="/login">Open demo console</Link>
          </Button>
          <Button asChild variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
            <Link href="/journey">Preview Pokemon journey</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
