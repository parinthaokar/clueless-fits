"use client";

import { useState } from "react";
import { Button, Card, Note } from "@/components/ui";
import { useStore } from "@/lib/store";

// /sign-in: email a magic link (Supabase Auth). The link comes back to /wardrobe, where the
// store picks up the session and loads the closet from Supabase.
export default function SignInPage() {
  const { account, sendSignInLink, signOut } = useStore();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setSending(true);
    setError(null);
    const message = await sendSignInLink(trimmed);
    setSending(false);
    if (message) setError(message);
    else setSentTo(trimmed);
  }

  return (
    <div className="mx-auto max-w-[480px]">
      <h1 className="mb-1 text-[28px] font-black tracking-[-0.01em]">Sign in</h1>
      <p className="mb-5 text-muted">Keep your closet and saved looks on every device.</p>

      <Card className="p-6">
        {account.status === "off" ? (
          <p>Sign-in isn&apos;t set up for this site yet. Your closet is saved in this browser.</p>
        ) : account.status === "signedIn" || account.status === "loading" ? (
          <div className="flex flex-col items-start gap-4">
            <p>
              Signed in as <strong>{account.email}</strong>.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button href="/wardrobe">Go to my wardrobe</Button>
              <Button variant="secondary" onClick={() => void signOut()}>
                Sign out
              </Button>
            </div>
          </div>
        ) : sentTo ? (
          <div className="flex flex-col items-start gap-4">
            <p>
              Check <strong>{sentTo}</strong> for a sign-in link. Open it in this browser.
            </p>
            <Button variant="secondary" onClick={() => setSentTo(null)}>
              Use a different email
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="block">
              <span className="mb-[5px] block text-xs font-bold tracking-[0.06em] uppercase">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border-2 border-ink bg-white px-3 py-2.5 text-[15px] text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-raspberry"
              />
            </label>
            {(error ?? account.linkError) && <Note>{error ?? account.linkError}</Note>}
            <Button type="submit" loading={sending} className="self-start">
              Email me a sign-in link
            </Button>
            <p className="text-sm text-muted">
              No password needed. Pieces you added before signing in stay in this browser.
            </p>
          </form>
        )}
      </Card>
    </div>
  );
}
