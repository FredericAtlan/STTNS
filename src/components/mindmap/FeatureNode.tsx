"use client";

import { MindMapNodeShell } from "./MindMapNodeShell";

export function FeatureNode(props: React.ComponentProps<typeof MindMapNodeShell>) {
  return <MindMapNodeShell {...props} />;
}
