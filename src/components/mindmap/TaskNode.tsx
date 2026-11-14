"use client";

import { MindMapNodeShell } from "./MindMapNodeShell";

export function TaskNode(props: React.ComponentProps<typeof MindMapNodeShell>) {
  return <MindMapNodeShell {...props} />;
}
