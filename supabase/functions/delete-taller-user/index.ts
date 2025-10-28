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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Client for user operations (uses service role)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the auth token from the request
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    
    // Client for verifying the requesting user
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the requesting user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Verify user is admin_taller
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || !userRole || userRole.role !== 'admin_taller') {
      console.error('Role verification error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Solo administradores pueden eliminar usuarios' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // Get the taller_id for the admin
    const { data: taller, error: tallerError } = await supabase
      .from('talleres')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (tallerError || !taller) {
      console.error('Taller lookup error:', tallerError);
      return new Response(
        JSON.stringify({ error: 'No se encontró el taller asociado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'ID de usuario requerido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Prevent self-deletion
    if (userId === user.id) {
      return new Response(
        JSON.stringify({ error: 'No puedes eliminar tu propia cuenta' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Verify the user belongs to the same taller
    const { data: empleadoData } = await supabase
      .from('taller_empleados')
      .select('id')
      .eq('user_id', userId)
      .eq('taller_id', taller.id)
      .single();

    if (!empleadoData) {
      return new Response(
        JSON.stringify({ error: 'Usuario no encontrado en tu taller' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Delete from taller_empleados using admin client to bypass RLS
    const { error: deleteEmpleadoError } = await supabaseAdmin
      .from('taller_empleados')
      .delete()
      .eq('user_id', userId);

    if (deleteEmpleadoError) {
      console.error('Error deleting employee:', deleteEmpleadoError);
      throw deleteEmpleadoError;
    }

    // Delete from user_roles using admin client to bypass RLS
    const { error: deleteRoleError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (deleteRoleError) {
      console.error('Error deleting role:', deleteRoleError);
    }

    // Delete user from auth
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      console.error('Error deleting user from auth:', deleteUserError);
      throw deleteUserError;
    }

    console.log('User deleted successfully:', userId);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in delete-taller-user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
