"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Brain,
  LayoutDashboard,
  MessageSquarePlus,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/chat", label: "Tutor", icon: Brain },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/knowledge", label: "Notes", icon: BookOpen },
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  const newChat = async () => {
    if (!token) return;
    const chat = await api.createChat(token);
    router.push(`/chat/${chat.id}`);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border/50 bg-background/90 px-4 py-2 backdrop-blur-xl md:hidden">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex flex-col items-center gap-0.5 text-xs",
            pathname.startsWith(item.href)
              ? "text-primary"
              : "text-muted-foreground",
          )}
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </Link>
      ))}
      <button
        type="button"
        onClick={newChat}
        className="flex flex-col items-center gap-0.5 text-xs text-primary"
      >
        <MessageSquarePlus className="h-5 w-5" />
        New
      </button>
    </nav>
  );
}
