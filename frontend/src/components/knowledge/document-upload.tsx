"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, Upload } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
  onUploaded: () => void;
}

export function DocumentUpload({ onUploaded }: DocumentUploadProps) {
  const token = useAuthStore((s) => s.token);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"file" | "text">("file");
  const [title, setTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const uploadFile = async (file: File) => {
    if (!token) return;
    setUploading(true);
    setError("");
    try {
      await api.uploadDocument(token, file, title || undefined);
      setTitle("");
      onUploaded();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleFile = (file: File | undefined) => {
    if (file) uploadFile(file);
  };

  const submitNote = async () => {
    if (!token || !title.trim() || noteContent.trim().length < 10) {
      setError("Title and at least 10 characters of content required");
      return;
    }
    setUploading(true);
    setError("");
    try {
      await api.uploadTextNote(token, {
        title: title.trim(),
        content: noteContent.trim(),
      });
      setTitle("");
      setNoteContent("");
      onUploaded();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="mb-4 flex gap-2">
        <Button
          variant={mode === "file" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("file")}
        >
          Upload file
        </Button>
        <Button
          variant={mode === "text" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("text")}
        >
          Paste notes
        </Button>
      </div>

      <div className="mb-4">
        <Label htmlFor="doc-title">Title (optional for files)</Label>
        <Input
          id="doc-title"
          className="mt-1.5"
          placeholder="e.g. Operating Systems Chapter 3"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {mode === "file" ? (
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files[0]);
          }}
          className={cn(
            "cursor-pointer rounded-xl border-2 border-dashed border-border/60 p-10 text-center transition-colors",
            dragging && "border-primary bg-primary/5",
            uploading && "pointer-events-none opacity-60",
          )}
        >
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept=".pdf,.txt,.md,.markdown"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          {uploading ? (
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          ) : (
            <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
          )}
          <p className="mt-4 font-medium">
            {dragging ? "Drop file here" : "Drag & drop or click to upload"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            PDF, TXT, or Markdown - max 5MB
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label htmlFor="note-content">Notes</Label>
            <Textarea
              id="note-content"
              className="mt-1.5 min-h-[160px]"
              placeholder="Paste your lecture notes, study material, or summaries..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
            />
          </div>
          <Button onClick={submitNote} disabled={uploading} className="w-full rounded-xl">
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Save to knowledge base
              </>
            )}
          </Button>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </GlassCard>
  );
}
