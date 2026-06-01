"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, GraduationCap, Send, StopCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useChatStore } from "@/stores/chat-store";
import { useKnowledgeStore } from "@/stores/knowledge-store";
import type { Citation, LearningMode, Message } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MarkdownMessage } from "./markdown-message";
import { TypingIndicator } from "./typing-indicator";
import { LearningModeSelector } from "./learning-mode-selector";
import { CitationsPanel } from "./citations-panel";
import { cn } from "@/lib/utils";

interface LocalMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  streaming?: boolean;
  citations?: Citation[];
}

interface ChatInterfaceProps {
  chatId: string;
  initialMessages?: Message[];
  initialMode?: LearningMode;
}

export function ChatInterface({
  chatId,
  initialMessages = [],
  initialMode = "beginner",
}: ChatInterfaceProps) {
  const token = useAuthStore((s) => s.token);
  const { activeMode, setActiveMode } = useChatStore();
  const { useKnowledge, setUseKnowledge } = useKnowledgeStore();
  const [messages, setMessages] = useState<LocalMessage[]>(
    initialMessages.map((m) => ({ ...m, id: m.id })),
  );
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showModes, setShowModes] = useState(messages.length === 0);
  const [activeCitations, setActiveCitations] = useState<Citation[]>([]);
  const messagesViewportRef = useRef<HTMLDivElement>(null);
  const shouldStickToBottomRef = useRef(true);
  const abortRef = useRef(false);

  const { data: stats } = useQuery({
    queryKey: ["knowledge-stats"],
    queryFn: () => api.knowledgeStats(token!),
    enabled: !!token,
  });

  const hasDocuments = (stats?.document_count ?? 0) > 0;

  useEffect(() => {
    setActiveMode(initialMode);
  }, [initialMode, setActiveMode]);

  const handleMessagesScroll = useCallback(() => {
    const el = messagesViewportRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    shouldStickToBottomRef.current = distanceFromBottom < 80;
  }, []);

  useEffect(() => {
    const el = messagesViewportRef.current;
    if (!el || !shouldStickToBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, activeCitations]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !token || isStreaming) return;

    const userContent = input.trim();
    setInput("");
    setShowModes(false);
    setActiveCitations([]);

    const userMsg: LocalMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: userContent,
      created_at: new Date().toISOString(),
    };

    const assistantId = crypto.randomUUID();
    const assistantMsg: LocalMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      created_at: new Date().toISOString(),
      streaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);
    abortRef.current = false;

    let messageCitations: Citation[] = [];

    try {
      for await (const event of api.streamMessage(token, chatId, userContent, {
        learningMode: activeMode,
        useKnowledge: useKnowledge && hasDocuments,
      })) {
        if (abortRef.current) break;
        if (event.type === "citations") {
          messageCitations = event.citations;
          setActiveCitations(event.citations);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, citations: event.citations } : m,
            ),
          );
        } else if (event.type === "content") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + event.text } : m,
            ),
          );
        }
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: `Sorry, something went wrong. ${err instanceof Error ? err.message : "Please try again."}`,
              }
            : m,
        ),
      );
    } finally {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, streaming: false, citations: messageCitations }
            : m,
        ),
      );
      setIsStreaming(false);
    }
  }, [
    input,
    token,
    chatId,
    activeMode,
    isStreaming,
    useKnowledge,
    hasDocuments,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="min-h-0 flex-1 overflow-hidden">
        <div
          ref={messagesViewportRef}
          onScroll={handleMessagesScroll}
          className="h-full overflow-y-auto px-4 md:px-8"
        >
          <div className="mx-auto w-full max-w-6xl space-y-6 py-6">
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card">
                  <GraduationCap className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  What would you like to learn?
                </h2>
                <p className="mt-2 max-w-md text-muted-foreground">
                  Choose a learning mode and ask anything - concepts, code, DSA,
                  interviews, or exam prep.
                </p>
                {!hasDocuments && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    <Link href="/knowledge" className="text-primary hover:underline">
                      Upload notes
                    </Link>{" "}
                    to enable contextual answers from your materials.
                  </p>
                )}
              </motion.div>
            )}

            {activeCitations.length > 0 && (
              <CitationsPanel
                citations={activeCitations}
                onClose={() => setActiveCitations([])}
              />
            )}

            <AnimatePresence mode="popLayout">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex flex-col gap-2",
                    msg.role === "user" ? "items-end" : "items-start",
                  )}
                >
                  {msg.citations && msg.citations.length > 0 && !msg.streaming && (
                    <div className="w-full max-w-[85%]">
                      <CitationsPanel citations={msg.citations} />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "glass-message border border-border/50 bg-card/80 backdrop-blur-sm",
                    )}
                  >
                    {msg.role === "assistant" ? (
                      msg.streaming && !msg.content ? (
                        <TypingIndicator />
                      ) : (
                        <MarkdownMessage
                          content={msg.content || "..."}
                          isStreaming={!!msg.streaming}
                        />
                      )
                    ) : (
                      <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                    )}
                    <p
                      className={cn(
                        "mt-2 text-[10px] opacity-60",
                        msg.role === "user" ? "text-right" : "text-left",
                      )}
                    >
                      {format(new Date(msg.created_at), "h:mm a")}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="border-t border-border/50 bg-background/80 p-4 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-6xl space-y-3">
          {(showModes || messages.length === 0) && (
            <LearningModeSelector
              value={activeMode}
              onChange={setActiveMode}
              compact={messages.length > 0}
            />
          )}

          <div className="flex items-center justify-between rounded-xl border border-border/40 bg-card/40 px-3 py-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <Label htmlFor="use-knowledge" className="text-sm cursor-pointer">
                Use my knowledge base
                {hasDocuments && (
                  <span className="ml-1 text-muted-foreground">
                    ({stats?.document_count} docs)
                  </span>
                )}
              </Label>
            </div>
            <Switch
              id="use-knowledge"
              checked={useKnowledge && hasDocuments}
              onCheckedChange={setUseKnowledge}
              disabled={!hasDocuments}
            />
          </div>
          {!hasDocuments && (
            <p className="text-xs text-muted-foreground px-1">
              <Link href="/knowledge" className="text-primary hover:underline">
                Add documents
              </Link>{" "}
              to enable RAG-powered answers with citations.
            </p>
          )}

          <div className="flex items-end gap-2 rounded-2xl border border-border/50 bg-card/50 p-2 shadow-sm">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                useKnowledge && hasDocuments
                  ? "Ask about your uploaded notes..."
                  : "Ask anything about your studies..."
              }
              className="min-h-[44px] max-h-32 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
              rows={1}
              disabled={isStreaming}
            />
            {isStreaming ? (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  abortRef.current = true;
                  setIsStreaming(false);
                }}
              >
                <StopCircle className="h-5 w-5" />
              </Button>
            ) : (
              <Button
                size="icon"
                className="shrink-0 rounded-xl"
                onClick={sendMessage}
                disabled={!input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
