"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  BookOpen,
  Brain,
  LayoutDashboard,
  LogOut,
  PenSquare,
  Workflow,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { ThemeToggle } from "./theme-toggle";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat",      label: "Tutor",     icon: Brain },
  { href: "/knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/visual",    label: "Visual",    icon: Workflow },
  { href: "/progress",  label: "Progress",  icon: BarChart3 },
];

interface ContextMenu {
  chatId: string;
  x: number;
  y: number;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token, user, clearAuth } = useAuthStore();

  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const { data: chats = [] } = useQuery({
    queryKey: ["chats"],
    queryFn: () => api.listChats(token!),
    enabled: !!token,
  });

  const deleteMutation = useMutation({
    mutationFn: (chatId: string) => api.deleteChat(token!, chatId),
    onSuccess: (_data, chatId) => {
      queryClient.setQueryData<typeof chats>(["chats"], (old) =>
        old ? old.filter((c) => c.id !== chatId) : [],
      );
      if (pathname === `/chat/${chatId}`) {
        router.push("/chat");
      }
    },
  });

  const handleRightClick = useCallback(
    (e: React.MouseEvent, chatId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ chatId, x: e.clientX, y: e.clientY });
    },
    [],
  );

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeContextMenu();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [contextMenu, closeContextMenu]);

  const menuStyle = contextMenu
    ? {
        top: Math.min(contextMenu.y, window.innerHeight - 80),
        left: Math.min(contextMenu.x, window.innerWidth - 180),
      }
    : {};

  const newChat = async () => {
    if (!token) return;
    const chat = await api.createChat(token);
    router.push(`/chat/${chat.id}`);
  };

  const logout = () => {
    clearAuth();
    router.push("/login");
  };

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <>
      <aside className="flex h-full w-[220px] flex-col border-r border-border/70 bg-sidebar select-none">

        {/* Brand Header */}
        <div className="px-4 pt-5 pb-4">
          <Link href="/dashboard" className="transition-opacity hover:opacity-90">
            <Logo size={34} />
          </Link>
        </div>

        {/* New Chat Action */}
        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={newChat}
            className="flex w-full items-center gap-2.5 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary transition-all hover:bg-primary/15 active:scale-[0.98]"
          >
            <PenSquare className="h-4 w-4 shrink-0" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Nav Items */}
        <nav className="space-y-0.5 px-2">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="mx-3 my-3 h-px bg-border/50" />

        {/* Recent Chats Section */}
        <div className="flex items-center justify-between px-4 pb-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Recent
          </span>
          <span className="text-[9px] text-muted-foreground/40 italic">right-click to delete</span>
        </div>

        {/* Chat List */}
        <ScrollArea className="min-h-0 flex-1 px-2">
          <div className="space-y-0.5 pb-2">
            {chats.map((chat) => {
              const active = pathname === `/chat/${chat.id}`;
              const isDeleting = deleteMutation.isPending && deleteMutation.variables === chat.id;

              return (
                <div key={chat.id} className="relative group/chat">
                  <Link
                    href={`/chat/${chat.id}`}
                    onContextMenu={(e) => handleRightClick(e, chat.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-colors",
                      active
                        ? "bg-muted text-foreground font-medium"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                      isDeleting && "opacity-40 pointer-events-none",
                    )}
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-40" />
                    <span className="truncate flex-1">{chat.title}</span>
                  </Link>
                </div>
              );
            })}
            {chats.length === 0 && (
              <p className="px-3 py-4 text-xs text-muted-foreground/60">
                No chats yet. Start learning!
              </p>
            )}
          </div>
        </ScrollArea>

        {/* User Profile Footer */}
        <div className="border-t border-border/50 p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary ring-1 ring-primary/20">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-foreground leading-tight">
                {user?.full_name ?? "Student"}
              </p>
              <p className="truncate text-[10px] text-muted-foreground leading-tight">
                {user?.email}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <ThemeToggle />
              <button
                type="button"
                onClick={logout}
                title="Sign out"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Right-click Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{ ...menuStyle, position: "fixed", zIndex: 9999 }}
          className="min-w-[160px] overflow-hidden rounded-xl border border-border/70 bg-popover shadow-xl shadow-black/20 backdrop-blur-sm animate-in fade-in-0 zoom-in-95 duration-100"
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="border-b border-border/50 px-3 py-2">
            <p className="text-[11px] font-medium text-muted-foreground truncate max-w-[140px]">
              {chats.find((c) => c.id === contextMenu.chatId)?.title ?? "Chat"}
            </p>
          </div>

          <div className="p-1">
            <button
              type="button"
              onClick={() => {
                deleteMutation.mutate(contextMenu.chatId);
                closeContextMenu();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10 active:bg-destructive/15"
            >
              <Trash2 className="h-3.5 w-3.5 shrink-0" />
              <span>Delete conversation</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
