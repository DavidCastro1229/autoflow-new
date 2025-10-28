import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

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
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        JSON.stringify({ error: 'Solo administradores pueden crear usuarios' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user data from request
    const { nombre, apellidos, email, password, role } = await req.json();

    // Validate input
    if (!nombre || !apellidos || !email || !password || !role) {
      return new Response(
        JSON.stringify({ error: 'Todos los campos son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (role !== 'taller' && role !== 'admin_taller') {
      return new Response(
        JSON.stringify({ error: 'Rol inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating user:', { nombre, apellidos, email, role });

    // Create the user in auth
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nombre,
        apellidos,
      }
    });

    if (createUserError) {
      console.error('Error creating user:', createUserError);
      return new Response(
        JSON.stringify({ error: `Error al crear usuario: ${createUserError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User created in auth:', newUser.user.id);

    // Create employee record
    const { error: empleadoError } = await supabase
      .from('taller_empleados')
      .insert({
        user_id: newUser.user.id,
        taller_id: taller.id,
        nombre,
        apellidos,
        email,
      });

    if (empleadoError) {
      console.error('Error creating employee record:', empleadoError);
      // Try to clean up the auth user
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ error: `Error al crear registro de empleado: ${empleadoError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Employee record created');

    // Assign role
    const { error: roleInsertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: role,
        taller_id: taller.id,
      });

    if (roleInsertError) {
      console.error('Error assigning role:', roleInsertError);
      // Clean up
      await supabase.from('taller_empleados').delete().eq('user_id', newUser.user.id);
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ error: `Error al asignar rol: ${roleInsertError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Role assigned successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
          nombre,
          apellidos,
          role,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});