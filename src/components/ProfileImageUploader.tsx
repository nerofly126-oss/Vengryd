import { useRef, useState } from "react";
import { Camera, Loader2, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type ProfileImageUploaderProps = {
  title: string;
  description: string;
  imageUrl?: string | null;
  fallback: string;
  onUpload: (file: File) => Promise<void>;
};

export function ProfileImageUploader({
  title,
  description,
  imageUrl,
  fallback,
  onUpload,
}: ProfileImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      await onUpload(file);
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-secondary/20 p-4">
      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16 rounded-2xl border border-border bg-card">
          <AvatarImage src={imageUrl || undefined} alt={title} className="object-cover" />
          <AvatarFallback className="rounded-2xl bg-primary/10 text-primary">
            {fallback}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={(event) => void handleFileChange(event)}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            className="mt-3 gap-2"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {isUploading ? "Uploading..." : "Upload Image"}
          </Button>
        </div>
      </div>
    </div>
  );
}
