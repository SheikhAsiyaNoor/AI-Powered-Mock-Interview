"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/Authcontext";
import { ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RoleGuardProps {
    allowedRoles: ("student" | "mentor" | "admin")[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
    allowedRoles,
    children,
    fallback
}) => {
    const { user, isLoggedIn, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!isLoggedIn) {
                router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
            } else if (user && !allowedRoles.includes(user.role)) {
                router.push("/unauthorized");
            }
        }
    }, [isLoading, isLoggedIn, user, allowedRoles, router]);

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-xs text-muted-foreground font-medium">Verifying access permissions...</p>
            </div>
        );
    }

    if (!isLoggedIn || !user || !allowedRoles.includes(user.role)) {
        if (fallback) return <>{fallback}</>;
        return null;
    }

    return <>{children}</>;
};

export default RoleGuard;
