"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  BookOpen,
  Brain,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageSquarePlus,
  MessagesSquare,
  Workflow,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "Tutor", icon: Brain },
  { href: "/knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/visual", label: "Visual", icon: Workflow },
  { href: "/progress", label: "Progress", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { token, user, clearAuth } = useAuthStore();

  const { data: chats = [] } = useQuery({
    queryKey: ["chats"],
    queryFn: () => api.listChats(token!),
    enabled: !!token,
  });

  const newChat = async () => {
    if (!token) return;
    const chat = await api.createChat(token);
    router.push(`/chat/${chat.id}`);
  };

  const logout = () => {
    clearAuth();
    router.push("/login");
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border/70 bg-sidebar">
      <div className="flex items-center gap-2 px-4 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card">
          <GraduationCap className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight">StudentOS</p>
          <p className="text-[10px] text-muted-foreground">Learning Workspace</p>
        </div>
      </div>

      <div className="px-3">
        <Button className="w-full justify-start gap-2 rounded-xl" onClick={newChat}>
          <MessageSquarePlus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <nav className="mt-4 space-y-1 px-3">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Separator className="my-4" />

      <div className="flex items-center justify-between px-4">
        <span className="text-xs font-medium text-muted-foreground">Recent</span>
        <MessagesSquare className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-0.5 py-2">
          {chats.map((chat) => (
            <Link
              key={chat.id}
              href={`/chat/${chat.id}`}
              className={cn(
                "block truncate rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted",
                pathname === `/chat/${chat.id}` && "bg-muted font-medium",
              )}
            >
              {chat.title}
            </Link>
          ))}
          {chats.length === 0 && (
            <p className="px-3 py-4 text-xs text-muted-foreground">
              No chats yet. Start learning!
            </p>
          )}
        </div>
      </ScrollArea>

      <div className="mt-auto border-t border-border/50 p-3">
        <div className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user?.full_name}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <ThemeToggle />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full justify-start gap-2 text-muted-foreground"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
