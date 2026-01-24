import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Store, Phone, MapPin, Edit2, Save, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface ShopInfo {
  shop_name: string;
  shop_type: string;
  phone_number: string;
  address: string;
}

interface ShopInfoCardProps {
  profile: any;
}

const ShopInfoCard = ({ profile }: ShopInfoCardProps) => {
  const { user, isGuest } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [shopInfo, setShopInfo] = useState<ShopInfo>({
    shop_name: "",
    shop_type: "",
    phone_number: "",
    address: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isGuest) {
      const guestProfile = localStorage.getItem("guestShopInfo");
      if (guestProfile) {
        setShopInfo(JSON.parse(guestProfile));
      }
    } else if (profile) {
      setShopInfo({
        shop_name: profile.shop_name || "",
        shop_type: profile.shop_type || "",
        phone_number: profile.phone_number || "",
        address: profile.address || "",
      });
    }
  }, [profile, isGuest]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (isGuest) {
        localStorage.setItem("guestShopInfo", JSON.stringify(shopInfo));
        toast({
          title: "Saved",
          description: "Shop information saved locally",
        });
      } else {
        const { error } = await supabase
          .from("profiles")
          .update({
            shop_name: shopInfo.shop_name,
            shop_type: shopInfo.shop_type,
            phone_number: shopInfo.phone_number,
            address: shopInfo.address,
          })
          .eq("user_id", user?.id);

        if (error) throw error;

        queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
        toast({
          title: "Saved",
          description: "Shop information updated successfully",
        });
      }
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving shop info:", error);
      toast({
        title: "Error",
        description: "Failed to save shop information",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (isGuest) {
      const guestProfile = localStorage.getItem("guestShopInfo");
      if (guestProfile) {
        setShopInfo(JSON.parse(guestProfile));
      }
    } else if (profile) {
      setShopInfo({
        shop_name: profile.shop_name || "",
        shop_type: profile.shop_type || "",
        phone_number: profile.phone_number || "",
        address: profile.address || "",
      });
    }
    setIsEditing(false);
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Store className="w-5 h-5 text-primary" />
          Shop Information
        </CardTitle>
        {!isEditing && (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            <Edit2 className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="shop_name">Shop Name</Label>
              <Input
                id="shop_name"
                value={shopInfo.shop_name}
                onChange={(e) => setShopInfo({ ...shopInfo, shop_name: e.target.value })}
                placeholder="Enter shop name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shop_type">Shop Type (optional)</Label>
              <Input
                id="shop_type"
                value={shopInfo.shop_type}
                onChange={(e) => setShopInfo({ ...shopInfo, shop_type: e.target.value })}
                placeholder="e.g., Mobile Shop, Grocery, Salon"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number (optional)</Label>
              <Input
                id="phone_number"
                value={shopInfo.phone_number}
                onChange={(e) => setShopInfo({ ...shopInfo, phone_number: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address (optional)</Label>
              <Input
                id="address"
                value={shopInfo.address}
                onChange={(e) => setShopInfo({ ...shopInfo, address: e.target.value })}
                placeholder="Enter address"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <Button variant="outline" onClick={handleCancel} className="flex-1">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Store className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Shop Name</p>
                <p className="font-medium">{shopInfo.shop_name || "Not set"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Store className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Shop Type</p>
                <p className="font-medium">{shopInfo.shop_type || "Not set"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Phone className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Phone Number</p>
                <p className="font-medium">{shopInfo.phone_number || "Not set"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <MapPin className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{shopInfo.address || "Not set"}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ShopInfoCard;
