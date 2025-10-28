import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error('Error verifying user:', userError);
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role, taller_id')
      .eq('user_id', user.id)
      .single();

    if (roleError || !userRole) {
      console.error('Error fetching user role:', roleError);
      return new Response(
        JSON.stringify({ error: 'No se pudo verificar el rol del usuario' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (userRole.role !== 'admin_taller' && userRole.role !== 'taller') {
      return new Response(
        JSON.stringify({ error: 'No tienes permisos para crear clientes' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tallerId = userRole.taller_id;
    if (!tallerId) {
      return new Response(
        JSON.stringify({ error: 'No se encontró el taller asociado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { nombre, apellido, nombre_empresa, email, password, telefono, tipo_cliente } = await req.json();

    if (!nombre || !apellido || !email || !password || !telefono || !tipo_cliente) {
      return new Response(
        JSON.stringify({ error: 'Todos los campos son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating user in auth...');
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createUserError || !newUser.user) {
      console.error('Error creating user:', createUserError);
      return new Response(
        JSON.stringify({ error: `Error al crear el usuario: ${createUserError?.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User created:', newUser.user.id);

    try {
      console.log('Creating cliente record...');
      const { data: cliente, error: clienteError } = await supabaseAdmin
        .from('clientes')
        .insert({
          user_id: newUser.user.id,
          taller_id: tallerId,
          nombre,
          apellido,
          nombre_empresa: nombre_empresa || null,
          email,
          telefono,
          tipo_cliente,
        })
        .select()
        .single();

      if (clienteError) {
        console.error('Error creating cliente:', clienteError);
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
        throw clienteError;
      }

      console.log('Creating user role...');
      const { error: roleInsertError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: newUser.user.id,
          role: 'cliente',
          taller_id: tallerId,
        });

      if (roleInsertError) {
        console.error('Error creating role:', roleInsertError);
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
        throw roleInsertError;
      }

      console.log('Cliente created successfully');
      return new Response(
        JSON.stringify({ cliente }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Error in transaction:', error);
      return new Response(
        JSON.stringify({ error: 'Error al crear el cliente' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
