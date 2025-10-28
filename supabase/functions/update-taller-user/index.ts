import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization')!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user is authenticated and has admin_taller role
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || roleData.role !== 'admin_taller') {
      console.error('User does not have admin_taller role');
      return new Response(
        JSON.stringify({ error: 'No tienes permisos de administrador' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // Get taller_id
    const { data: tallerData } = await supabaseClient
      .from('talleres')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!tallerData) {
      return new Response(
        JSON.stringify({ error: 'Taller no encontrado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    const { userId, nombre, apellidos, email, role } = await req.json();

    if (!userId || !nombre || !apellidos) {
      return new Response(
        JSON.stringify({ error: 'Datos incompletos' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Verify the user belongs to the same taller
    const { data: empleadoData } = await supabaseClient
      .from('taller_empleados')
      .select('id')
      .eq('user_id', userId)
      .eq('taller_id', tallerData.id)
      .single();

    if (!empleadoData) {
      return new Response(
        JSON.stringify({ error: 'Usuario no encontrado en tu taller' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Update taller_empleados
    const { error: updateError } = await supabaseClient
      .from('taller_empleados')
      .update({ 
        nombre, 
        apellidos,
        email: email || empleadoData.email 
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating employee:', updateError);
      throw updateError;
    }

    // Update email if provided and changed
    if (email) {
      const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { email }
      );

      if (emailError) {
        console.error('Error updating email:', emailError);
      }
    }

    // Update role if provided
    if (role && (role === 'taller' || role === 'admin_taller')) {
      const { error: roleError } = await supabaseClient
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);

      if (roleError) {
        console.error('Error updating role:', roleError);
      }
    }

    console.log('User updated successfully:', userId);

    return new Response(
      JSON.stringify({ success: true, userId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in update-taller-user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
