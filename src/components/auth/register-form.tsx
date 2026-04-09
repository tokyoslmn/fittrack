"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
        role: formData.get("role"),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Greška pri registraciji");
      return;
    }

    router.push("/login");
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">FitTrack</CardTitle>
        <p className="text-muted-foreground">Kreiraj novi nalog</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Ime i prezime</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Lozinka</Label>
            <Input id="password" name="password" type="password" minLength={6} required />
          </div>
          <div className="space-y-2">
            <Label>Uloga</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" name="role" value="CLIENT" defaultChecked className="accent-primary" />
                <span>Klijent</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="role" value="TRAINER" className="accent-primary" />
                <span>Trener</span>
              </label>
            </div>
          </div>
          {error && (
            <p className="text-sm text-danger">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Registracija..." : "Registruj se"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Već imaš nalog?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Prijavi se
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
