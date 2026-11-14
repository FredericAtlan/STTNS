"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil } from "lucide-react";

interface Props {
  initialTitle: string;
  onSave: (newTitle: string) => Promise<any>;
  readOnly?: boolean;
}

export function InlineEditableTitle({ initialTitle, onSave, readOnly }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  async function handleSave() {
    if (title.trim() === "" || title.trim() === initialTitle) {
      setTitle(initialTitle);
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(title.trim());
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      setTitle(initialTitle); // Revert on error
    } finally {
      setIsSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setTitle(initialTitle);
      setIsEditing(false);
    }
  }

  if (readOnly) {
    return <span>{initialTitle}</span>;
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        disabled={isSaving}
        className="bg-transparent border-b-2 border-emerald-500 focus:outline-none focus:border-emerald-600 text-inherit font-inherit w-full max-w-xl"
      />
    );
  }

  return (
    <span
      className="group relative cursor-pointer hover:text-emerald-800 transition-colors inline-flex items-center gap-2"
      onClick={() => setIsEditing(true)}
      title="Cliquer pour renommer"
    >
      {title}
      <Pencil className="h-4 w-4 opacity-0 group-hover:opacity-100 text-emerald-600 transition-opacity" />
    </span>
  );
}
