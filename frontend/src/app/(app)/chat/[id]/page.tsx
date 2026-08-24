"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { ChatInterface } from "@/components/chat/chat-interface";
import { Skeleton } from "@/components/ui/skeleton";
import type { LearningMode } from "@/types";

export default function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hasHydrated);

  const { data: chat, isLoading, error } = useQuery({
    queryKey: ["chat", id],
    queryFn: () => api.getChat(token!, id),
    enabled: hydrated && !!token && !!id,
  });

  if (!hydrated || !token || isLoading) {
    return (
      <div className="flex h-full w-full flex-col justify-center items-center gap-3 p-6">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-xs text-muted-foreground">Loading workspace...</p>
      </div>
    );
  }

  if (error || !chat) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Conversation not found
      </div>
    );
  }

  return (
    <ChatInterface
      chatId={chat.id}
      initialMessages={chat.messages}
      initialMode={chat.learning_mode as LearningMode}
    />
  );
}
