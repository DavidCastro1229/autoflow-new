-- Create mensajes table for real-time chat between aseguradoras and talleres
CREATE TABLE IF NOT EXISTS public.mensajes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aseguradora_id UUID NOT NULL REFERENCES public.aseguradoras(id) ON DELETE CASCADE,
  taller_id UUID NOT NULL REFERENCES public.talleres(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('aseguradora', 'taller')),
  contenido TEXT NOT NULL,
  leido BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_mensajes_aseguradora ON public.mensajes(aseguradora_id);
CREATE INDEX idx_mensajes_taller ON public.mensajes(taller_id);
CREATE INDEX idx_mensajes_created_at ON public.mensajes(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.mensajes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for aseguradoras to view and send messages to their affiliated talleres
CREATE POLICY "Aseguradoras can view messages with their talleres"
ON public.mensajes
FOR SELECT
USING (
  aseguradora_id IN (
    SELECT id FROM public.aseguradoras WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Aseguradoras can send messages to their talleres"
ON public.mensajes
FOR INSERT
WITH CHECK (
  aseguradora_id IN (
    SELECT id FROM public.aseguradoras WHERE user_id = auth.uid()
  )
  AND sender_type = 'aseguradora'
);

-- RLS Policies for talleres to view and send messages to their aseguradoras
CREATE POLICY "Talleres can view messages with their aseguradoras"
ON public.mensajes
FOR SELECT
USING (
  taller_id IN (
    SELECT taller_id FROM public.user_roles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Talleres can send messages to their aseguradoras"
ON public.mensajes
FOR INSERT
WITH CHECK (
  taller_id IN (
    SELECT taller_id FROM public.user_roles WHERE user_id = auth.uid()
  )
  AND sender_type = 'taller'
);

-- RLS Policy for updating message read status
CREATE POLICY "Users can update their received messages"
ON public.mensajes
FOR UPDATE
USING (
  (sender_type = 'taller' AND aseguradora_id IN (
    SELECT id FROM public.aseguradoras WHERE user_id = auth.uid()
  ))
  OR
  (sender_type = 'aseguradora' AND taller_id IN (
    SELECT taller_id FROM public.user_roles WHERE user_id = auth.uid()
  ))
);

-- Super admins can manage all messages
CREATE POLICY "Super admins can manage all mensajes"
ON public.mensajes
FOR ALL
USING (has_role('super_admin'::app_role, auth.uid()))
WITH CHECK (has_role('super_admin'::app_role, auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_mensajes_updated_at
BEFORE UPDATE ON public.mensajes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensajes;