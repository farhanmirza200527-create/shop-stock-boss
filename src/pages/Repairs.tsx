import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CalendarIcon, Wrench, RefreshCw, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";

interface Repair {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  device_model: string;
  problem_description: string;
  parts_used: string | null;
  estimated_cost: number;
  final_cost: number;
  received_date: string;
  delivery_date: string | null;
  repair_status: string;
  warranty_available: boolean;
  warranty_period: string | null;
  photo_url: string | null;
  created_at: string;
}

const Repairs = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deviceModel, setDeviceModel] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [partsUsed, setPartsUsed] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [finalCost, setFinalCost] = useState("");
  const [receivedDate, setReceivedDate] = useState<Date>(new Date());
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(undefined);
  const [repairStatus, setRepairStatus] = useState("Received");
  const [warrantyAvailable, setWarrantyAvailable] = useState("No");
  const [warrantyPeriod, setWarrantyPeriod] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Fetch all repairs
  const { data: repairs, isLoading } = useQuery({
    queryKey: ["repairs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("repairs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Repair[];
    },
  });

  // Add repair mutation
  const addRepairMutation = useMutation({
    mutationFn: async (repairData: any) => {
      // CRITICAL: Re-fetch current session to ensure we have the latest user
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;

      // Block save if user is not authenticated
      if (!currentUserId) {
        throw new Error("You must be logged in to add repairs. Please login again.");
      }

      let photoUrl = null;

      // Upload photo if provided
      if (photoFile) {
        const fileExt = photoFile.name.split(".").pop();
        const fileName = `${currentUserId}/${Math.random()}.${fileExt}`;
        const filePath = `repair-photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(filePath, photoFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);

        photoUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("repairs").insert([{
        customer_name: repairData.customer_name,
        customer_phone: repairData.customer_phone || null,
        device_model: repairData.device_model,
        problem_description: repairData.problem_description,
        parts_used: repairData.parts_used || null,
        estimated_cost: repairData.estimated_cost,
        final_cost: repairData.final_cost,
        received_date: repairData.received_date,
        delivery_date: repairData.delivery_date || null,
        repair_status: repairData.repair_status,
        warranty_available: repairData.warranty_available,
        warranty_period: repairData.warranty_period || null,
        photo_url: photoUrl,
        user_id: currentUserId,
      }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repairs"] });
      toast({
        title: "Success",
        description: "🧰 Repair job added successfully!",
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add repair job",
        variant: "destructive",
      });
      console.error("Error adding repair:", error);
    },
  });

  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setDeviceModel("");
    setProblemDescription("");
    setPartsUsed("");
    setEstimatedCost("");
    setFinalCost("");
    setReceivedDate(new Date());
    setDeliveryDate(undefined);
    setRepairStatus("Received");
    setWarrantyAvailable("No");
    setWarrantyPeriod("");
    setPhotoFile(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !deviceModel || !problemDescription) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    addRepairMutation.mutate({
      customer_name: customerName,
      customer_phone: customerPhone,
      device_model: deviceModel,
      problem_description: problemDescription,
      parts_used: partsUsed,
      estimated_cost: parseFloat(estimatedCost) || 0,
      final_cost: parseFloat(finalCost) || 0,
      received_date: format(receivedDate, "yyyy-MM-dd"),
      delivery_date: deliveryDate ? format(deliveryDate, "yyyy-MM-dd") : null,
      repair_status: repairStatus,
      warranty_available: warrantyAvailable === "Yes",
      warranty_period: warrantyAvailable === "Yes" ? warrantyPeriod : null,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Received":
        return "bg-blue-100 text-blue-800";
      case "In Progress":
        return "bg-yellow-100 text-yellow-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Delivered":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 pb-20">
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 bg-card/50 backdrop-blur-sm p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-2">
            <Wrench className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-primary">Repair / Service Section</h1>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["repairs"] })}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="add" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="all">All Repairs</TabsTrigger>
            <TabsTrigger value="add">Add New Repair</TabsTrigger>
          </TabsList>

          {/* All Repairs Tab */}
          <TabsContent value="all">
            <div className="grid gap-4">
              {isLoading ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    Loading repairs...
                  </CardContent>
                </Card>
              ) : repairs && repairs.length > 0 ? (
                repairs.map((repair) => (
                  <Card key={repair.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{repair.customer_name}</CardTitle>
                          <CardDescription>
                            {repair.customer_phone && `📞 ${repair.customer_phone}`}
                          </CardDescription>
                        </div>
                        <span
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium",
                            getStatusColor(repair.repair_status)
                          )}
                        >
                          {repair.repair_status}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Device</p>
                          <p className="font-medium">{repair.device_model}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Problem</p>
                          <p className="font-medium text-sm">{repair.problem_description}</p>
                        </div>
                        {repair.parts_used && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Parts Used</p>
                            <p className="font-medium text-sm">{repair.parts_used}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Cost</p>
                          <p className="font-medium">
                            Est: ₹{repair.estimated_cost} | Final: ₹{repair.final_cost}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Received</p>
                          <p className="font-medium">
                            {format(new Date(repair.received_date), "dd MMM yyyy")}
                          </p>
                        </div>
                        {repair.delivery_date && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Delivery</p>
                            <p className="font-medium">
                              {format(new Date(repair.delivery_date), "dd MMM yyyy")}
                            </p>
                          </div>
                        )}
                        {repair.warranty_available && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Warranty</p>
                            <p className="font-medium">✓ {repair.warranty_period}</p>
                          </div>
                        )}
                      </div>
                      {repair.photo_url && (
                        <div className="mt-4">
                          <img
                            src={repair.photo_url}
                            alt="Repair"
                            className="w-full max-w-xs rounded-lg shadow-md"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No repair jobs found. Add your first repair!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Add New Repair Tab */}
          <TabsContent value="add">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Add New Repair Job</CardTitle>
                <CardDescription>Fill in the details for the repair job</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Customer Name */}
                    <div className="space-y-2">
                      <Label htmlFor="customerName">
                        Customer Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="customerName"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Enter customer name"
                        required
                      />
                    </div>

                    {/* Customer Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="customerPhone">Customer Phone Number</Label>
                      <Input
                        id="customerPhone"
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Enter phone number"
                      />
                    </div>

                    {/* Device Model */}
                    <div className="space-y-2">
                      <Label htmlFor="deviceModel">
                        Device Model <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="deviceModel"
                        value={deviceModel}
                        onChange={(e) => setDeviceModel(e.target.value)}
                        placeholder="e.g., iPhone 12, Samsung A52"
                        required
                      />
                    </div>

                    {/* Repair Status */}
                    <div className="space-y-2">
                      <Label htmlFor="repairStatus">Repair Status</Label>
                      <Select value={repairStatus} onValueChange={setRepairStatus}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Received">Received</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Delivered">Delivered</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Problem Description */}
                  <div className="space-y-2">
                    <Label htmlFor="problemDescription">
                      Problem Description <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="problemDescription"
                      value={problemDescription}
                      onChange={(e) => setProblemDescription(e.target.value)}
                      placeholder="Describe the problem in detail"
                      rows={3}
                      required
                    />
                  </div>

                  {/* Parts Used */}
                  <div className="space-y-2">
                    <Label htmlFor="partsUsed">Parts Used / Needed</Label>
                    <Textarea
                      id="partsUsed"
                      value={partsUsed}
                      onChange={(e) => setPartsUsed(e.target.value)}
                      placeholder="List parts required or used"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Estimated Cost */}
                    <div className="space-y-2">
                      <Label htmlFor="estimatedCost">Estimated Cost (₹)</Label>
                      <Input
                        id="estimatedCost"
                        type="number"
                        value={estimatedCost}
                        onChange={(e) => setEstimatedCost(e.target.value)}
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    {/* Final Cost */}
                    <div className="space-y-2">
                      <Label htmlFor="finalCost">Final Cost (₹)</Label>
                      <Input
                        id="finalCost"
                        type="number"
                        value={finalCost}
                        onChange={(e) => setFinalCost(e.target.value)}
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    {/* Received Date */}
                    <div className="space-y-2">
                      <Label>Received Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !receivedDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {receivedDate ? format(receivedDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={receivedDate}
                            onSelect={(date) => date && setReceivedDate(date)}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Delivery Date */}
                    <div className="space-y-2">
                      <Label>Delivery Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !deliveryDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {deliveryDate ? format(deliveryDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={deliveryDate}
                            onSelect={setDeliveryDate}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Warranty Available */}
                    <div className="space-y-2">
                      <Label htmlFor="warrantyAvailable">Warranty Available</Label>
                      <Select value={warrantyAvailable} onValueChange={setWarrantyAvailable}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="No">No</SelectItem>
                          <SelectItem value="Yes">Yes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Warranty Period */}
                    {warrantyAvailable === "Yes" && (
                      <div className="space-y-2">
                        <Label htmlFor="warrantyPeriod">Warranty Period</Label>
                        <Input
                          id="warrantyPeriod"
                          value={warrantyPeriod}
                          onChange={(e) => setWarrantyPeriod(e.target.value)}
                          placeholder="e.g., 6 months, 1 year"
                        />
                      </div>
                    )}
                  </div>

                  {/* Photo Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="photo">Upload Photo (optional)</Label>
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90"
                    size="lg"
                    disabled={addRepairMutation.isPending}
                  >
                    {addRepairMutation.isPending ? "Adding..." : "Add Repair Job ✅"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
};

export default Repairs;