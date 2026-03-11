import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, Plus, Trash2, Upload } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PaymentQRCard = () => {
  const { user, isGuest } = useAuth();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [label, setLabel] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Guest mode QR codes from localStorage
  const [guestQRs, setGuestQRs] = useState<{ id: string; label: string; image_url: string }[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("guestPaymentQRs") || "[]");
    } catch { return []; }
  });

  const saveGuestQRs = (qrs: typeof guestQRs) => {
    setGuestQRs(qrs);
    localStorage.setItem("guestPaymentQRs", JSON.stringify(qrs));
  };

  // Fetch QR codes for authenticated users
  const { data: dbQRCodes = [] } = useQuery({
    queryKey: ["payment-qr-codes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_qr_codes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !isGuest,
  });

  const qrCodes = isGuest ? guestQRs : dbQRCodes;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleAdd = async () => {
    if (!selectedFile) {
      toast.error("Please select a QR code image");
      return;
    }

    setUploading(true);
    try {
      if (isGuest) {
        // Convert to base64 for guest storage
        const reader = new FileReader();
        reader.onload = () => {
          const newQR = {
            id: crypto.randomUUID(),
            label: label || "My QR Code",
            image_url: reader.result as string,
          };
          saveGuestQRs([newQR, ...guestQRs]);
          toast.success("QR code added!");
          resetDialog();
        };
        reader.readAsDataURL(selectedFile);
      } else {
        // Upload to storage
        const fileExt = selectedFile.name.split(".").pop();
        const filePath = `${user!.id}/payment-qr-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);

        const { error: insertError } = await supabase
          .from("payment_qr_codes")
          .insert({
            user_id: user!.id,
            label: label || "My QR Code",
            image_url: urlData.publicUrl,
          });

        if (insertError) throw insertError;

        queryClient.invalidateQueries({ queryKey: ["payment-qr-codes"] });
        toast.success("QR code added!");
        resetDialog();
      }
    } catch (error) {
      console.error("Error adding QR code:", error);
      toast.error("Failed to add QR code");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (isGuest) {
        saveGuestQRs(guestQRs.filter(q => q.id !== id));
        toast.success("QR code removed");
      } else {
        const { error } = await supabase
          .from("payment_qr_codes")
          .delete()
          .eq("id", id);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ["payment-qr-codes"] });
        toast.success("QR code removed");
      }
    } catch (error) {
      console.error("Error deleting QR code:", error);
      toast.error("Failed to remove QR code");
    }
  };

  const resetDialog = () => {
    setShowAddDialog(false);
    setLabel("");
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  return (
    <>
      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            Payment QR Codes
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          {qrCodes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No payment QR codes added yet. Add your UPI/payment QR codes to show customers during online payment.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {qrCodes.map((qr) => (
                <div key={qr.id} className="relative group rounded-lg border overflow-hidden bg-muted/30">
                  <img
                    src={qr.image_url}
                    alt={qr.label}
                    className="w-full aspect-square object-contain p-2"
                  />
                  <div className="p-2 text-center">
                    <p className="text-xs font-medium truncate">{qr.label}</p>
                  </div>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDelete(qr.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={resetDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Add Payment QR Code
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., GPay, PhonePe, Paytm"
              />
            </div>
            <div className="space-y-2">
              <Label>QR Code Image</Label>
              {previewUrl ? (
                <div className="relative border rounded-lg p-2">
                  <img src={previewUrl} alt="Preview" className="w-full aspect-square object-contain" />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-1 right-1"
                    onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Tap to upload QR image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              )}
            </div>
            <Button onClick={handleAdd} disabled={uploading || !selectedFile} className="w-full">
              {uploading ? "Uploading..." : "Add QR Code"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PaymentQRCard;
