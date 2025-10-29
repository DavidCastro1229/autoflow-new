import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "taller" | "admin_taller" | "aseguradora" | "super_admin";

export const useUserRole = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [tallerId, setTallerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setRole(null);
        setTallerId(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role, taller_id")
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        console.error("Error fetching user role:", error);
        setRole(null);
        setTallerId(null);
      } else {
        setRole(data.role as UserRole);
        setTallerId(data.taller_id);
      }
      
      setLoading(false);
    };

    fetchUserRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { role, tallerId, loading };
};
