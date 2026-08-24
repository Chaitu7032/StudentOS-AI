"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, BookOpen, Globe, RotateCcw, Square } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useChatStore } from "@/stores/chat-store";
import { useKnowledgeStore } from "@/stores/knowledge-store";
import type { Citation, LearningMode, Message } from "@/types";
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

const STARTER_PROMPTS = [
  "Explain how virtual memory works and why page faults happen, with a diagram.",
  "Teach me QuickSort with time complexity analysis and a step-by-step illustration.",
  "Design a scalable URL shortening service with architecture trade-offs.",
  "How do I implement rate limiting in FastAPI with Redis and asyncpg?",
];

interface ComposerProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isStreaming: boolean;
  isConversationActive: boolean;
  onAbort: () => void;
  useKnowledge: boolean;
  setUseKnowledge: (v: boolean) => void;
  hasDocuments: boolean;
  useWebSearch: boolean;
  setUseWebSearch: (v: boolean) => void;
  autoFocus?: boolean;
}

function Composer({
  input,
  setInput,
  onSend,
  onKeyDown,
  isStreaming,
  isConversationActive,
  onAbort,
  useKnowledge,
  setUseKnowledge,
  hasDocuments,
  useWebSearch,
  setUseWebSearch,
  autoFocus = false,
}: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [input]);

  return (
    <div className="relative rounded-xl border border-border bg-card transition-shadow focus-within:shadow-[0_0_0_2px_hsl(var(--ring)/0.3)]">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        autoFocus={autoFocus}
        placeholder={
          useKnowledge && hasDocuments
            ? "Ask about your notes..."
            : "Message StudentOS..."
        }
        rows={1}
        disabled={isStreaming && isConversationActive}
        className={cn(
          "block w-full resize-none bg-transparent px-4 pt-3.5 pb-3",
          "text-sm placeholder:text-muted-foreground/50",
          "focus:outline-none",
          "min-h-[52px] max-h-[200px]",
        )}
      />

      <div className="flex items-center justify-between px-3 pb-3">
        {/* Tool toggles */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => hasDocuments && setUseKnowledge(!useKnowledge)}
            disabled={!hasDocuments}
            title={hasDocuments ? "Search notes" : "Upload notes to enable"}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              useKnowledge && hasDocuments
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
              !hasDocuments && "opacity-40 cursor-not-allowed",
            )}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Notes
          </button>
          <button
            type="button"
            onClick={() => setUseWebSearch(!useWebSearch)}
            title="Search the web"
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              useWebSearch
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            <Globe className="h-3.5 w-3.5" />
            Web
          </button>
        </div>

        {/* Send / Stop */}
        {isStreaming && isConversationActive ? (
          <button
            type="button"
            onClick={onAbort}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background transition-opacity hover:opacity-80"
            aria-label="Stop"
          >
            <Square className="h-3 w-3 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSend}
            disabled={!input.trim()}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
              input.trim()
                ? "bg-foreground text-background hover:opacity-80"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
            aria-label="Send"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function ChatInterface({
  chatId,
  initialMessages = [],
  initialMode = "beginner",
}: ChatInterfaceProps) {
  const token = useAuthStore((s) => s.token);
  const { activeMode, setActiveMode } = useChatStore();
  const { useKnowledge, setUseKnowledge } = useKnowledgeStore();
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [messages, setMessages] = useState<LocalMessage[]>(
    initialMessages.map((m) => ({ ...m, id: m.id })),
  );
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
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
  const isConversationActive = messages.length > 0;

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
  }, [messages, activeCitations, isStreaming]);

  const sendMessage = useCallback(
    async (overrideText?: string) => {
      const textToSend = (overrideText ?? input).trim();
      if (!textToSend || !token || isStreaming) return;

      setInput("");
      setActiveCitations([]);

      const userMsg: LocalMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: textToSend,
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
        for await (const event of api.streamMessage(token, chatId, textToSend, {
          learningMode: activeMode,
          useKnowledge: useKnowledge && hasDocuments,
          useWeb: useWebSearch,
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
                  content: `Something went wrong. ${err instanceof Error ? err.message : "Please try again."}`,
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
    },
    [input, token, chatId, activeMode, isStreaming, useKnowledge, hasDocuments, useWebSearch],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const regenerateLast = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser) sendMessage(lastUser.content);
  };

  // ─── LANDING ─────────────────────────────────────────────────────────────
  if (!isConversationActive) {
    return (
      <div className="flex h-full w-full flex-col overflow-y-auto">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-10 px-5 py-16">

          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              What do you want to learn?
            </h1>
            <p className="text-sm text-muted-foreground">
              From fundamentals to system design — ask anything.
            </p>
          </div>

          <Composer
            input={input}
            setInput={setInput}
            onSend={() => sendMessage()}
            onKeyDown={handleKeyDown}
            isStreaming={isStreaming}
            isConversationActive={isConversationActive}
            onAbort={() => { abortRef.current = true; setIsStreaming(false); }}
            useKnowledge={useKnowledge}
            setUseKnowledge={setUseKnowledge}
            hasDocuments={hasDocuments}
            useWebSearch={useWebSearch}
            setUseWebSearch={setUseWebSearch}
            autoFocus
          />

          <div className="space-y-4">
            {/* Mode */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Mode</p>
              <LearningModeSelector value={activeMode} onChange={setActiveMode} />
            </div>

            {/* Starter prompts */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Try a prompt</p>
              <div className="space-y-1">
                {STARTER_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => sendMessage(p)}
                    className="block w-full rounded-lg border border-border/60 px-3.5 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // ─── CONVERSATION ─────────────────────────────────────────────────────────
  return (
    <div className="flex h-full w-full flex-col">

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <div
          ref={messagesViewportRef}
          onScroll={handleMessagesScroll}
          className="h-full overflow-y-auto"
        >
          <div className="mx-auto w-full max-w-2xl space-y-8 px-5 py-8">

            {activeCitations.length > 0 && (
              <CitationsPanel
                citations={activeCitations}
                onClose={() => setActiveCitations([])}
              />
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg, index) => {
                const isUser = msg.role === "user";
                const isLast = index === messages.length - 1;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className={cn("flex", isUser ? "justify-end" : "justify-start")}
                  >
                    {isUser ? (
                      <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-muted px-4 py-2.5 text-sm text-foreground">
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      </div>
                    ) : (
                      <div className="w-full max-w-full space-y-3">
                        {msg.citations && msg.citations.length > 0 && !msg.streaming && (
                          <CitationsPanel citations={msg.citations} />
                        )}
                        {msg.streaming && !msg.content ? (
                          <div className="py-2">
                            <TypingIndicator />
                          </div>
                        ) : (
                          <MarkdownMessage
                            content={msg.content}
                            isStreaming={!!msg.streaming}
                            onSelectPrompt={(p) => sendMessage(p)}
                            onRegenerate={isLast ? regenerateLast : undefined}
                            isLastAssistant={isLast}
                          />
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            <div className="h-2" />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="shrink-0 border-t border-border/60 bg-background px-5 py-3">
        <div className="mx-auto w-full max-w-2xl space-y-2">
          <div className="flex items-center justify-between gap-3">
            <LearningModeSelector value={activeMode} onChange={setActiveMode} compact />
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => hasDocuments && setUseKnowledge(!useKnowledge)}
                disabled={!hasDocuments}
                title={hasDocuments ? "Search notes" : "No documents indexed"}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  useKnowledge && hasDocuments
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  !hasDocuments && "opacity-40 cursor-not-allowed",
                )}
              >
                <BookOpen className="h-3.5 w-3.5" />
                Notes
              </button>
              <button
                type="button"
                onClick={() => setUseWebSearch(!useWebSearch)}
                title="Search the web"
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  useWebSearch
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                <Globe className="h-3.5 w-3.5" />
                Web
              </button>
            </div>
          </div>
          <Composer
            input={input}
            setInput={setInput}
            onSend={() => sendMessage()}
            onKeyDown={handleKeyDown}
            isStreaming={isStreaming}
            isConversationActive={isConversationActive}
            onAbort={() => { abortRef.current = true; setIsStreaming(false); }}
            useKnowledge={useKnowledge}
            setUseKnowledge={setUseKnowledge}
            hasDocuments={hasDocuments}
            useWebSearch={useWebSearch}
            setUseWebSearch={setUseWebSearch}
          />
        </div>
      </div>

    </div>
  );
}
