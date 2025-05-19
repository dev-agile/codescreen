import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./queryClient";
import { useState, useEffect } from "react";
import { LoginCredentials, insertUserSchema } from "@shared/schema";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  name: string;
  company?: string;
};

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Get current user
  const {
    data: user,
    isLoading: isLoadingUser,
    error: userError,
  } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    onError: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data);
      setLocation("/dashboard");
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.name}!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive",
      });
    },
  });

  // Signup mutation
  const signupMutation = useMutation({
    mutationFn: async (userData: any) => {
      const res = await apiRequest("POST", "/api/auth/signup", userData);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data);
      setLocation("/dashboard");
      toast({
        title: "Account created successfully",
        description: `Welcome, ${data.name}!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Signup failed",
        description: error.message || "Please check your information and try again",
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/logout", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.invalidateQueries();
      setLocation("/login");
      toast({
        title: "Logged out successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Custom hook to redirect if not authenticated
  const useRequireAuth = (redirectTo = "/login") => {
    const [, setLocation] = useLocation();

    useEffect(() => {
      if (userError) {
        setLocation(redirectTo);
      }
    }, [userError, redirectTo, setLocation]);

    return user;
  };

  return {
    user,
    isLoadingUser,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    signup: signupMutation.mutate,
    isSigningUp: signupMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    useRequireAuth,
  };
}
