import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  ordenId: string;
  faseId: string;
  faseTitulo: string;
  mensaje: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ordenId, faseId, faseTitulo, mensaje }: NotificationRequest = await req.json();

    console.log("Received notification request:", { ordenId, faseId, faseTitulo, mensaje });

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get order details with client info
    const { data: orden, error: ordenError } = await supabase
      .from("ordenes")
      .select(`
        id,
        descripcion,
        cliente:clientes(
          id,
          nombre,
          apellido,
          email,
          telefono
        )
      `)
      .eq("id", ordenId)
      .single();

    if (ordenError) {
      console.error("Error fetching order:", ordenError);
      throw new Error("Error al obtener información de la orden");
    }

    if (!orden || !orden.cliente) {
      console.error("Order or client not found");
      throw new Error("Orden o cliente no encontrado");
    }

    // Handle cliente as array or single object from join
    const clienteData = Array.isArray(orden.cliente) ? orden.cliente[0] : orden.cliente;
    if (!clienteData) {
      throw new Error("Cliente no encontrado");
    }

    const clienteNombre = `${clienteData.nombre} ${clienteData.apellido}`;
    const clienteEmail = clienteData.email;
    const clienteTelefono = clienteData.telefono;
    
    // Personalizar mensaje reemplazando variables
    const mensajePersonalizado = mensaje
      .replace("{cliente}", clienteNombre)
      .replace("{fase}", faseTitulo)
      .replace("{orden}", orden.descripcion || ordenId);

    console.log("Sending notifications to:", {
      email: clienteEmail,
      telefono: clienteTelefono,
      mensaje: mensajePersonalizado,
    });

    const results = {
      email: { success: false, error: null as string | null },
      whatsapp: { success: false, error: null as string | null },
    };

    // Send Email via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey && clienteEmail) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "AutoFlowx <onboarding@resend.dev>",
            to: [clienteEmail],
            subject: `Actualización de su servicio - Fase: ${faseTitulo}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #3B82F6;">Actualización de su servicio</h2>
                <p>Estimado/a ${clienteNombre},</p>
                <p>${mensajePersonalizado}</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">
                  Este es un mensaje automático de AutoFlowx. Por favor no responda a este correo.
                </p>
              </div>
            `,
          }),
        });
        const emailResult = await emailResponse.json();
        console.log("Email sent successfully:", emailResult);
        if (emailResponse.ok) {
          results.email.success = true;
        } else {
          results.email.error = emailResult.message || "Error sending email";
        }
      } catch (emailError: any) {
        console.error("Error sending email:", emailError);
        results.email.error = emailError.message;
      }
    } else {
      results.email.error = !resendApiKey ? "RESEND_API_KEY not configured" : "Client email not available";
      console.log("Email not sent:", results.email.error);
    }

    // Send WhatsApp via WhatSurvey API
    const whatsappApiKey = Deno.env.get("WHATSURVEY_API_KEY");
    if (whatsappApiKey && clienteTelefono) {
      try {
        // Clean phone number - remove spaces, dashes, and leading zeros
        let phoneNumber = clienteTelefono.replace(/[\s\-\(\)]/g, "");
        
        // If the number doesn't start with country code, assume Mexico (52)
        if (!phoneNumber.startsWith("+") && !phoneNumber.startsWith("52")) {
          // Remove leading zeros
          phoneNumber = phoneNumber.replace(/^0+/, "");
          phoneNumber = "52" + phoneNumber;
        } else if (phoneNumber.startsWith("+")) {
          phoneNumber = phoneNumber.substring(1);
        }

        const whatsappBody = {
          sessionName: "AutoFlowx",
          chatId: `${phoneNumber}@c.us`,
          text: mensajePersonalizado,
        };

        console.log("Sending WhatsApp message:", whatsappBody);

        const whatsappResponse = await fetch("https://whatsurvey.mx/api/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${whatsappApiKey}`,
          },
          body: JSON.stringify(whatsappBody),
        });

        const whatsappResult = await whatsappResponse.json();
        console.log("WhatsApp API response:", whatsappResult);

        if (whatsappResponse.ok) {
          results.whatsapp.success = true;
        } else {
          results.whatsapp.error = whatsappResult.message || "Error sending WhatsApp";
        }
      } catch (whatsappError: any) {
        console.error("Error sending WhatsApp:", whatsappError);
        results.whatsapp.error = whatsappError.message;
      }
    } else {
      results.whatsapp.error = !whatsappApiKey ? "WHATSURVEY_API_KEY not configured" : "Client phone not available";
      console.log("WhatsApp not sent:", results.whatsapp.error);
    }

    return new Response(
      JSON.stringify({
        success: results.email.success || results.whatsapp.success,
        results,
        message: `Notificaciones enviadas: Email ${results.email.success ? "✓" : "✗"}, WhatsApp ${results.whatsapp.success ? "✓" : "✗"}`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-fase-notification:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
