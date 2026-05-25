"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Binary, GitBranch, Layers, Network, Workflow } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { DiagramGallery } from "@/components/visual/diagram-gallery";
import { ConceptMap } from "@/components/visual/concept-map";
import { DsaVisualizer } from "@/components/visual/dsa-visualizer";
import { AnimatedLearningBlock } from "@/components/visual/animated-learning-block";
import { CONCEPT_MAPS } from "@/lib/visual-templates";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

const visualTips = [
  {
    title: "Diagrams in chat",
    description:
      "Use Visual Learning mode in Tutor to generate Mermaid flowcharts and architecture diagrams inline.",
    icon: GitBranch,
  },
  {
    title: "Step through algorithms",
    description:
      "DSA Lab animates bubble sort and binary search so you can follow every step.",
    icon: Binary,
  },
  {
    title: "Expand concept maps",
    description:
      "Click any topic to reveal an interactive diagram for fast revision.",
    icon: Network,
  },
];

export default function VisualLearningPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  const startVisualChat = async () => {
    if (!token) return;
    const chat = await api.createChat(token, { learning_mode: "visual" });
    router.push(`/chat/${chat.id}`);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mesh-gradient pointer-events-none fixed inset-0 opacity-30" />
      <div className="relative mx-auto max-w-5xl space-y-8 p-6 md:p-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card">
              <Workflow className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Visual Learning
              </h1>
              <p className="text-muted-foreground">
                Diagrams, DSA animations, and interactive concept maps
              </p>
            </div>
          </div>
          <Button className="rounded-xl shrink-0" onClick={startVisualChat}>
            Tutor - Visual Mode
          </Button>
        </motion.div>

        <div className="grid gap-3 sm:grid-cols-3">
          {visualTips.map((tip, i) => (
            <AnimatedLearningBlock
              key={tip.title}
              title={tip.title}
              description={tip.description}
              icon={tip.icon}
              index={i}
            />
          ))}
        </div>

        <Tabs defaultValue="diagrams" className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-xl">
            <TabsTrigger value="diagrams" className="gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              Diagrams
            </TabsTrigger>
            <TabsTrigger value="dsa" className="gap-1.5">
              <Binary className="h-3.5 w-3.5" />
              DSA Lab
            </TabsTrigger>
            <TabsTrigger value="concepts" className="gap-1.5">
              <Network className="h-3.5 w-3.5" />
              Concept Maps
            </TabsTrigger>
          </TabsList>

          <TabsContent value="diagrams" className="mt-6">
            <GlassCard className="p-6">
              <DiagramGallery />
            </GlassCard>
          </TabsContent>

          <TabsContent value="dsa" className="mt-6">
            <DsaVisualizer />
            <GlassCard className="mt-4 p-4 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Tip:</strong> Ask the Tutor in
                Visual mode to explain the algorithm while you step through it here.{" "}
                <Link href="/chat" className="text-primary hover:underline">
                  Open chat
                </Link>
              </p>
            </GlassCard>
          </TabsContent>

          <TabsContent value="concepts" className="mt-6">
            <ConceptMap items={CONCEPT_MAPS} defaultOpen={CONCEPT_MAPS[0].id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
