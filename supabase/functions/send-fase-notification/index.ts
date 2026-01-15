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
            from: "AutoFlowx <davidcastro505personal@gmail.com>",
            to: [clienteEmail],
            subject: `Actualización de su servicio - Fase: ${faseTitulo}`,
            html: `
              <!DOCTYPE html>
              <html lang="es">
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="margin: 0; padding: 0; background-color: #f4f7fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f7fa; padding: 40px 20px;">
                  <tr>
                    <td align="center">
                      <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); overflow: hidden;">
                        <!-- Header -->
                        <tr>
                          <td style="background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); padding: 40px 40px 30px 40px; text-align: center;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                              <tr>
                                <td align="center">
                                  <div style="width: 70px; height: 70px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; display: inline-block; line-height: 70px;">
                                    <span style="font-size: 32px;">🔧</span>
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td align="center" style="padding-top: 20px;">
                                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                                    Actualización de Servicio
                                  </h1>
                                </td>
                              </tr>
                              <tr>
                                <td align="center" style="padding-top: 8px;">
                                  <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                                    Su vehículo está siendo atendido
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                          <td style="padding: 40px;">
                            <!-- Greeting -->
                            <p style="margin: 0 0 24px 0; color: #1f2937; font-size: 18px; font-weight: 600;">
                              Hola ${clienteNombre} 👋
                            </p>
                            
                            <!-- Phase Badge -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                              <tr>
                                <td>
                                  <div style="background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%); border-radius: 12px; padding: 20px; border-left: 4px solid #3B82F6;">
                                    <table role="presentation" cellspacing="0" cellpadding="0">
                                      <tr>
                                        <td style="vertical-align: middle; padding-right: 12px;">
                                          <div style="width: 44px; height: 44px; background-color: #3B82F6; border-radius: 10px; text-align: center; line-height: 44px;">
                                            <span style="font-size: 20px;">✅</span>
                                          </div>
                                        </td>
                                        <td style="vertical-align: middle;">
                                          <p style="margin: 0; color: #6B7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">
                                            Fase completada
                                          </p>
                                          <p style="margin: 4px 0 0 0; color: #1D4ED8; font-size: 18px; font-weight: 700;">
                                            ${faseTitulo}
                                          </p>
                                        </td>
                                      </tr>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            </table>
                            
                            <!-- Message -->
                            <div style="background-color: #F9FAFB; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                              <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.7;">
                                ${mensajePersonalizado}
                              </p>
                            </div>
                            
                            <!-- Info Box -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                              <tr>
                                <td style="background-color: #FEF3C7; border-radius: 10px; padding: 16px;">
                                  <table role="presentation" cellspacing="0" cellpadding="0">
                                    <tr>
                                      <td style="vertical-align: top; padding-right: 12px;">
                                        <span style="font-size: 20px;">💡</span>
                                      </td>
                                      <td>
                                        <p style="margin: 0; color: #92400E; font-size: 14px; line-height: 1.5;">
                                          Le mantendremos informado sobre cada avance de su vehículo. ¡Gracias por confiar en nosotros!
                                        </p>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                            
                            <!-- Divider -->
                            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 32px 0;">
                            
                            <!-- Questions Section -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                              <tr>
                                <td align="center">
                                  <p style="margin: 0 0 4px 0; color: #6B7280; font-size: 14px;">
                                    ¿Tiene alguna pregunta?
                                  </p>
                                  <p style="margin: 0; color: #3B82F6; font-size: 14px; font-weight: 600;">
                                    Contáctenos directamente con nuestro equipo
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                          <td style="background-color: #1F2937; padding: 32px 40px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                              <tr>
                                <td align="center">
                                  <p style="margin: 0 0 8px 0; color: #F3F4F6; font-size: 18px; font-weight: 700;">
                                    AutoFlowx
                                  </p>
                                  <p style="margin: 0 0 16px 0; color: #9CA3AF; font-size: 13px;">
                                    Sistema de gestión automotriz
                                  </p>
                                  <hr style="border: none; border-top: 1px solid #374151; margin: 16px 0;">
                                  <p style="margin: 0; color: #6B7280; font-size: 12px; line-height: 1.6;">
                                    Este es un mensaje automático. Por favor no responda directamente a este correo.
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Sub-footer -->
                      <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="padding-top: 24px;">
                        <tr>
                          <td align="center">
                            <p style="margin: 0; color: #9CA3AF; font-size: 12px;">
                              © ${new Date().getFullYear()} AutoFlowx. Todos los derechos reservados.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
              </html>
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
