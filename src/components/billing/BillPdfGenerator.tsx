import { jsPDF } from "jspdf";
import { toast } from "sonner";

interface BillItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
  itemType?: string;
  categoryName?: string;
}

interface BillData {
  billNumber: string;
  customerName?: string;
  customerPhone?: string;
  items: BillItem[];
  subTotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  paidAmount: number;
  returnAmount: number;
  paymentMode: string;
  billStatus: string;
  createdAt: string;
  shopName?: string;
  shopAddress?: string;
}

export const generateBillPdf = (billData: BillData): jsPDF => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = 20;

  // Header - Shop Info
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(billData.shopName || "My Manager", pageWidth / 2, yPos, { align: "center" });
  yPos += 7;

  if (billData.shopAddress) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(billData.shopAddress, pageWidth / 2, yPos, { align: "center" });
    yPos += 5;
  }

  // Bill Number and Date
  yPos += 5;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Bill No: ${billData.billNumber}`, margin, yPos);
  doc.text(`Date: ${new Date(billData.createdAt).toLocaleDateString("en-IN")}`, pageWidth - margin, yPos, { align: "right" });
  yPos += 5;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Time: ${new Date(billData.createdAt).toLocaleTimeString("en-IN")}`, pageWidth - margin, yPos, { align: "right" });
  yPos += 10;

  // Customer Info
  if (billData.customerName || billData.customerPhone) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Customer Details:", margin, yPos);
    yPos += 5;
    doc.setFont("helvetica", "normal");
    if (billData.customerName) {
      doc.text(`Name: ${billData.customerName}`, margin, yPos);
      yPos += 5;
    }
    if (billData.customerPhone) {
      doc.text(`Phone: ${billData.customerPhone}`, margin, yPos);
      yPos += 5;
    }
    yPos += 5;
  }

  // Line separator
  doc.setDrawColor(200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // Items Header
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  const colWidths = [80, 25, 25, 35];
  doc.text("Item", margin, yPos);
  doc.text("Price", margin + colWidths[0], yPos);
  doc.text("Qty", margin + colWidths[0] + colWidths[1], yPos);
  doc.text("Total", margin + colWidths[0] + colWidths[1] + colWidths[2], yPos);
  yPos += 3;

  doc.setDrawColor(150);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 5;

  // Items
  doc.setFont("helvetica", "normal");
  billData.items.forEach((item) => {
    const itemName = item.productName.length > 35 
      ? item.productName.substring(0, 32) + "..." 
      : item.productName;
    
    doc.text(itemName, margin, yPos);
    doc.text(`₹${item.price.toLocaleString("en-IN")}`, margin + colWidths[0], yPos);
    doc.text(item.quantity.toString(), margin + colWidths[0] + colWidths[1], yPos);
    doc.text(`₹${item.subtotal.toLocaleString("en-IN")}`, margin + colWidths[0] + colWidths[1] + colWidths[2], yPos);
    yPos += 6;

    // Check for page overflow
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
  });

  // Line separator
  yPos += 3;
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // Summary
  const summaryX = pageWidth - margin - 80;
  doc.setFontSize(11);

  doc.text("Subtotal:", summaryX, yPos);
  doc.text(`₹${billData.subTotal.toLocaleString("en-IN")}`, pageWidth - margin, yPos, { align: "right" });
  yPos += 6;

  if (billData.discount > 0) {
    doc.text("Discount:", summaryX, yPos);
    doc.text(`- ₹${billData.discount.toLocaleString("en-IN")}`, pageWidth - margin, yPos, { align: "right" });
    yPos += 6;
  }

  if (billData.tax > 0) {
    doc.text("Tax:", summaryX, yPos);
    doc.text(`+ ₹${billData.tax.toLocaleString("en-IN")}`, pageWidth - margin, yPos, { align: "right" });
    yPos += 6;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Grand Total:", summaryX, yPos);
  doc.text(`₹${billData.grandTotal.toLocaleString("en-IN")}`, pageWidth - margin, yPos, { align: "right" });
  yPos += 10;

  // Payment Details
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Payment Mode: ${billData.paymentMode}`, margin, yPos);
  yPos += 6;
  doc.text(`Amount Paid: ₹${billData.paidAmount.toLocaleString("en-IN")}`, margin, yPos);
  yPos += 6;

  if (billData.returnAmount > 0) {
    doc.text(`Return/Change: ₹${billData.returnAmount.toLocaleString("en-IN")}`, margin, yPos);
    yPos += 6;
  }

  doc.setFont("helvetica", "bold");
  doc.text(`Status: ${billData.billStatus}`, margin, yPos);
  yPos += 15;

  // Footer
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text("Generated by My Manager", pageWidth / 2, yPos, { align: "center" });

  return doc;
};

export const downloadBillPdf = (billData: BillData) => {
  try {
    const doc = generateBillPdf(billData);
    doc.save(`${billData.billNumber}.pdf`);
    toast.success("Bill PDF downloaded successfully!");
  } catch (error) {
    console.error("Error generating PDF:", error);
    toast.error("Failed to generate PDF");
  }
};

export const shareBillPdf = async (billData: BillData) => {
  try {
    const doc = generateBillPdf(billData);
    const pdfBlob = doc.output("blob");
    const file = new File([pdfBlob], `${billData.billNumber}.pdf`, { type: "application/pdf" });

    if (navigator.share && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: `Bill - ${billData.billNumber}`,
        text: `Bill for ${billData.customerName || "Customer"} - Total: ₹${billData.grandTotal.toLocaleString("en-IN")}`,
        files: [file],
      });
      toast.success("Bill shared successfully!");
    } else {
      // Fallback to download
      downloadBillPdf(billData);
    }
  } catch (error) {
    if ((error as Error).name !== "AbortError") {
      console.error("Error sharing PDF:", error);
      downloadBillPdf(billData);
    }
  }
};

export type { BillData, BillItem };
