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

  const { data: chat, isLoading, error } = useQuery({
    queryKey: ["chat", id],
    queryFn: () => api.getChat(token!, id),
    enabled: !!token && !!id,
  });

  if (isLoading) {
    return (
      <div className="flex h-full flex-col gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="flex-1 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !chat) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Chat not found
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
