"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// Use server proxy for profile operations (httpOnly token)
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Edit2 } from "lucide-react";

interface EditProfileDialogProps {
  initialData: {
    display_name?: string;
    bio?: string;
    avatar_url?: string;
    location_name?: string;
  };
}

export function EditProfileDialog({ initialData }: EditProfileDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    display_name: initialData.display_name || "",
    bio: initialData.bio || "",
    avatar_url: initialData.avatar_url || "",
    location_name: initialData.location_name || "",
  });
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file?: File | null) => {
    if (!file) return null;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "avatar");

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || d.detail || "Upload failed");
      }

      const data = await res.json();
      return data.url || data.file_url || data.url;
    } catch (err) {
      const e = err as Error;
      toast.error(e.message || "Error subiendo la imagen");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/users/profiles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.detail || "Error al actualizar el perfil");
      }

      toast.success("Perfil actualizado");
      setOpen(false);
      router.refresh();
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Error al actualizar el perfil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 rounded-xl border-[#2563EB]/20 bg-[#EEF6FF] text-[#2563EB] hover:bg-[#E0EFFF]"
        onClick={() => setOpen(true)}
      >
        <Edit2 className="h-4 w-4" />
        Editar perfil
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
          </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="display_name">Nombre</Label>
            <Input
              id="display_name"
              name="display_name"
              value={formData.display_name}
              onChange={handleChange}
              placeholder="Tu nombre y apellido"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatar">Foto de perfil</Label>
            <Input
              id="avatar"
              name="avatar"
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const f = e.target.files?.[0] || null;
                const url = await handleFile(f);
                if (url) setFormData((p) => ({ ...p, avatar_url: url }));
              }}
              className="h-auto border-0 bg-transparent px-0 py-0 text-sm text-foreground shadow-none file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
            {uploading && <p className="text-xs text-muted-foreground">Subiendo...</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="location_name">Ciudad</Label>
            <Input
              id="location_name"
              name="location_name"
              value={formData.location_name}
              onChange={handleChange}
              placeholder="Ej. Madrid, España"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Biografía</Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Cuéntanos un poco sobre ti..."
              className="resize-none h-24"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
