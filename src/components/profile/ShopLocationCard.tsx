import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Navigation, ExternalLink, Trash2, Edit2, X, Save } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface LocationInfo {
  latitude: number | null;
  longitude: number | null;
  address_text: string;
  city: string;
  state: string;
}

interface ShopLocationCardProps {
  profile: any;
}

const ShopLocationCard = ({ profile }: ShopLocationCardProps) => {
  const { user, isGuest } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationInfo, setLocationInfo] = useState<LocationInfo>({
    latitude: null,
    longitude: null,
    address_text: "",
    city: "",
    state: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const hasLocation = locationInfo.latitude !== null && locationInfo.longitude !== null;

  useEffect(() => {
    if (isGuest) {
      const guestLocation = localStorage.getItem("guestShopLocation");
      if (guestLocation) {
        setLocationInfo(JSON.parse(guestLocation));
      }
    } else if (profile) {
      setLocationInfo({
        latitude: profile.latitude || null,
        longitude: profile.longitude || null,
        address_text: profile.address_text || "",
        city: profile.city || "",
        state: profile.state || "",
      });
    }
  }, [profile, isGuest]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Not Supported",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationInfo({
          ...locationInfo,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsGettingLocation(false);
        toast({
          title: "Location Found",
          description: "Your current location has been detected",
        });
      },
      (error) => {
        setIsGettingLocation(false);
        let message = "Unable to get your location";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Location permission denied. Please enter address manually.";
        }
        toast({
          title: "Location Error",
          description: message,
          variant: "destructive",
        });
      }
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (isGuest) {
        localStorage.setItem("guestShopLocation", JSON.stringify(locationInfo));
        toast({
          title: "Saved",
          description: "Location saved locally",
        });
      } else {
        const { error } = await supabase.rpc("update_user_profile", {
          p_latitude: locationInfo.latitude,
          p_longitude: locationInfo.longitude,
          p_address_text: locationInfo.address_text,
          p_city: locationInfo.city,
          p_state: locationInfo.state,
        });

        if (error) throw error;

        queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
        toast({
          title: "Saved",
          description: "Location updated successfully",
        });
      }
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving location:", error);
      toast({
        title: "Error",
        description: "Failed to save location",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveLocation = async () => {
    setIsSaving(true);
    try {
      const emptyLocation: LocationInfo = {
        latitude: null,
        longitude: null,
        address_text: "",
        city: "",
        state: "",
      };

      if (isGuest) {
        localStorage.removeItem("guestShopLocation");
        setLocationInfo(emptyLocation);
        toast({
          title: "Removed",
          description: "Location removed",
        });
      } else {
        const { error } = await supabase
          .from("profiles")
          .update({
            latitude: null,
            longitude: null,
            address_text: null,
            city: null,
            state: null,
          })
          .eq("user_id", user?.id);

        if (error) throw error;

        setLocationInfo(emptyLocation);
        queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
        toast({
          title: "Removed",
          description: "Location removed successfully",
        });
      }
    } catch (error) {
      console.error("Error removing location:", error);
      toast({
        title: "Error",
        description: "Failed to remove location",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const openInMaps = () => {
    if (hasLocation) {
      const url = `https://www.google.com/maps?q=${locationInfo.latitude},${locationInfo.longitude}`;
      window.open(url, "_blank");
    }
  };

  const handleCancel = () => {
    if (isGuest) {
      const guestLocation = localStorage.getItem("guestShopLocation");
      if (guestLocation) {
        setLocationInfo(JSON.parse(guestLocation));
      } else {
        setLocationInfo({
          latitude: null,
          longitude: null,
          address_text: "",
          city: "",
          state: "",
        });
      }
    } else if (profile) {
      setLocationInfo({
        latitude: profile.latitude || null,
        longitude: profile.longitude || null,
        address_text: profile.address_text || "",
        city: profile.city || "",
        state: profile.state || "",
      });
    }
    setIsEditing(false);
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Shop Location
        </CardTitle>
        {hasLocation && !isEditing && (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            <Edit2 className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing || !hasLocation ? (
          <>
            <Button
              variant="outline"
              className="w-full"
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
            >
              <Navigation className="w-4 h-4 mr-2" />
              {isGettingLocation ? "Getting Location..." : "Use Current Location (GPS)"}
            </Button>

            {locationInfo.latitude && locationInfo.longitude && (
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                <p className="text-muted-foreground">Coordinates</p>
                <p className="font-medium">
                  {locationInfo.latitude.toFixed(6)}, {locationInfo.longitude.toFixed(6)}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="address_text">Address (optional)</Label>
              <Input
                id="address_text"
                value={locationInfo.address_text}
                onChange={(e) => setLocationInfo({ ...locationInfo, address_text: e.target.value })}
                placeholder="Enter street address"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="city">City (optional)</Label>
                <Input
                  id="city"
                  value={locationInfo.city}
                  onChange={(e) => setLocationInfo({ ...locationInfo, city: e.target.value })}
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State (optional)</Label>
                <Input
                  id="state"
                  value={locationInfo.state}
                  onChange={(e) => setLocationInfo({ ...locationInfo, state: e.target.value })}
                  placeholder="State"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : "Save Location"}
              </Button>
              {(hasLocation || isEditing) && (
                <Button variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">
                {locationInfo.address_text || 
                  `${locationInfo.latitude?.toFixed(6)}, ${locationInfo.longitude?.toFixed(6)}`}
              </p>
              {(locationInfo.city || locationInfo.state) && (
                <p className="text-sm text-muted-foreground mt-1">
                  {[locationInfo.city, locationInfo.state].filter(Boolean).join(", ")}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={openInMaps}>
                <ExternalLink className="w-4 h-4 mr-2" />
                View on Map
              </Button>
              <Button
                variant="outline"
                onClick={handleRemoveLocation}
                disabled={isSaving}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ShopLocationCard;
