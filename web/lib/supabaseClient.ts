import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn(
    "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to enable authentication."
  );
}

export { supabase };

// Types for authentication
export type AuthUser = {
  id: string;
  email: string;
  phone?: string;
};

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

// Get current user session
export async function getCurrentUser() {
  try {
    if (!supabase) {
      return null;
    }
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("Error getting session:", error);
      return null;
    }

    if (!session?.user) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email || "",
      phone: session.user.phone,
    };
  } catch (e) {
    console.error("getCurrentUser error:", e);
    return null;
  }
}

// Sign up with email and password
export async function signUp(email: string, password: string, phone?: string) {
  try {
    if (!supabase) {
      throw new Error(
        "Authentication not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
      );
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          phone: phone || "",
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.user;
  } catch (error) {
    throw error;
  }
}

// Sign in with email and password
export async function signIn(email: string, password: string) {
  try {
    if (!supabase) {
      throw new Error(
        "Authentication not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
      );
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw new Error(error.message);
    }
    return data.user;
  } catch (error) {
    throw error;
  }
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

// Reset password
export async function resetPassword(email: string) {
  try {
    if (!supabase) {
      throw new Error(
        "Authentication not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
      );
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo:
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/reset-password`
          : undefined,
    });

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    throw error;
  }
}

// Update password
export async function updatePassword(newPassword: string) {
  try {
    if (!supabase) {
      throw new Error(
        "Authentication not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
      );
    }
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    throw error;
  }
}
