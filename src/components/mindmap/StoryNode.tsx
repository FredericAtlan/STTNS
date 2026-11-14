"use client";

import { MindMapNodeShell } from "./MindMapNodeShell";

export function StoryNode(props: React.ComponentProps<typeof MindMapNodeShell>) {
  return <MindMapNodeShell {...props} />;
}
