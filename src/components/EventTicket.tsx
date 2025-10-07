import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download } from "lucide-react";

interface EventTicketProps {
  registrationId: string;
  eventTitle: string;
  eventDate: string;
  venue: string;
}

const EventTicket = ({ registrationId, eventTitle, eventDate, venue }: EventTicketProps) => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    generateQRCode();
  }, [registrationId]);

  const generateQRCode = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke("generate-qr-code", {
        body: { registrationId },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;
      
      if (data?.qrCode) {
        setQrCode(data.qrCode);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadTicket = () => {
    const svg = document.getElementById("event-qr-code");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");

      const downloadLink = document.createElement("a");
      downloadLink.download = `${eventTitle}-ticket.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  if (loading || !qrCode) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">Generating ticket...</div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="text-center">
        <h3 className="font-bold text-lg mb-2">{eventTitle}</h3>
        <p className="text-sm text-muted-foreground">
          {new Date(eventDate).toLocaleDateString()} • {venue}
        </p>
      </div>

      <div className="flex justify-center bg-white p-4 rounded-lg">
        <QRCodeSVG
          id="event-qr-code"
          value={qrCode}
          size={200}
          level="H"
          includeMargin
        />
      </div>

      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Show this QR code at the event entrance
        </p>
        <Button onClick={downloadTicket} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Download Ticket
        </Button>
      </div>
    </Card>
  );
};

export default EventTicket;
