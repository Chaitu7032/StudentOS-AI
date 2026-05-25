"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      const res = await api.login(data);
      setAuth(res.access_token, res.user);
      router.push("/dashboard");
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else if (
        e instanceof Error &&
        /fetch|network|failed to fetch/i.test(e.message)
      ) {
        setError("Cannot reach backend API. Start backend and verify NEXT_PUBLIC_API_URL.");
      } else {
        setError("Login failed");
      }
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <div className="mesh-gradient pointer-events-none fixed inset-0 opacity-50" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card">
            <GraduationCap className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to StudentOS
          </p>
        </div>

        <GlassCard className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                className="mt-1.5"
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                className="mt-1.5"
                {...register("password")}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full rounded-xl"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            No account?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
}
