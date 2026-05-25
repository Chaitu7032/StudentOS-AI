"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChatIndexPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) return;
    api.createChat(token).then((chat) => {
      router.replace(`/chat/${chat.id}`);
    });
  }, [token, router]);

  return (
    <div className="flex h-full items-center justify-center">
      <Skeleton className="h-8 w-48" />
    </div>
  );
}
