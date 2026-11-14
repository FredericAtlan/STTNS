"use client";

import { MindMapNodeShell } from "./MindMapNodeShell";

export function EpicNode(props: React.ComponentProps<typeof MindMapNodeShell>) {
  return <MindMapNodeShell {...props} />;
}
