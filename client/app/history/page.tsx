"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HistoryRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/dashboard?tab=history");
    }, [router]);

    return (
        <div className="min-h-[50vh] flex items-center justify-center p-8 text-center text-xs text-muted-foreground font-medium">
            Redirecting to interview history...
        </div>
    );
}
