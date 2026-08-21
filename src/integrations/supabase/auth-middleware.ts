import { createMiddleware } from "@tanstack/react-start";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./client";

export const authMiddleware = createMiddleware().server(async ({ next }) => {
  let user: User | null = null;
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;
  } catch {
    // User is not authenticated; proceed with user = null.
  }

  return next({
    context: {
      user,
    },
  });
});
