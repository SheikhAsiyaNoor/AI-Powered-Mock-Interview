"use client";

import React from "react";
import Image from "next/image";

interface BrandLogoProps {
    size?: number;
    showText?: boolean;
    className?: string;
    textClassName?: string;
}

export default function BrandLogo({
    size = 38,
    showText = true,
    className = "",
    textClassName = "",
}: BrandLogoProps) {
    return (
        <div className={`flex items-center gap-2.5 group cursor-pointer select-none ${className}`}>
            {/* SVG Logo Icon */}
            <div
                className="relative shrink-0 transition-transform duration-300 group-hover:scale-105"
                style={{ width: size, height: size }}
            >
                <img
                    src="/logo.svg"
                    width={size}
                    height={size}
                    alt="Iperitus Logo"
                    className="w-full h-full object-contain rounded-xl"
                />
            </div>

            {/* Brand Typography */}
            {showText && (
                <div className={`flex flex-col leading-tight ${textClassName}`}>
                    <span className="font-extrabold text-base tracking-tight text-foreground transition-colors">
                        Iperitus
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium tracking-tight -mt-0.5 whitespace-nowrap">
                        Absolute pointers, zero blind spots
                    </span>
                </div>
            )}
        </div>
    );
}
