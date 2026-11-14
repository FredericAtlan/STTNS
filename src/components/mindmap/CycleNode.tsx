"use client";

import { MindMapNodeShell } from "./MindMapNodeShell";

export function CycleNode(props: React.ComponentProps<typeof MindMapNodeShell>) {
  return <MindMapNodeShell {...props} />;
}
