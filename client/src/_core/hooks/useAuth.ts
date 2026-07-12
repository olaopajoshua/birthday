import { supabase } from "@/lib/supabase";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    // Ensure the query always resolves — even if the server returns an error,
    // the query is no longer in a loading state
    staleTime: 0,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  // The key fix: loading should be false once the query has finished
  // (whether with data or with an error). tRPC useQuery sets isLoading
  // to true only on the initial fetch; once it settles, isLoading becomes false.
  // However, we also track when the query is fetching (refetching) separately.
  const loading = meQuery.isLoading || logoutMutation.isPending;
  const error = meQuery.error ?? logoutMutation.error ?? null;
  const user = meQuery.data ?? null;
  const isAuthenticated = Boolean(user);

  const state = useMemo(
    () => ({
      user,
      loading,
      error,
      isAuthenticated,
    }),
    [user, loading, error, isAuthenticated]
  );

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(() => {
      void utils.auth.me.invalidate();
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [utils]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (loading) return;
    if (user) return;
    if (typeof window === "undefined") return;

    // Redirect to /login for protected routes
    window.location.href = "/login";
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    loading,
    user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
