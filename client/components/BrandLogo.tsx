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
            {/* Hidden SVG Filter to remove light background via CSS without modifying logo.svg */}
            <svg width="0" height="0" className="absolute w-0 h-0 overflow-hidden pointer-events-none" aria-hidden="true">
                <defs>
                    <filter id="mokio-logo-filter" colorInterpolationFilters="sRGB">
                        {/* 1. Calculate greyscale for chroma/saturation check */}
                        <feColorMatrix
                            type="matrix"
                            values="
                                0.333 0.333 0.333 0 0
                                0.333 0.333 0.333 0 0
                                0.333 0.333 0.333 0 0
                                0     0     0     1 0
                            "
                            result="grey"
                        />
                        {/* 2. Difference from greyscale identifies saturated colorful crystal/artwork */}
                        <feComposite in="SourceGraphic" in2="grey" operator="arithmetic" k2="1" k3="-1" result="colorDiff" />
                        
                        {/* 3. Boost saturation to produce an alpha mask for colored crystal facets */}
                        <feColorMatrix
                            in="colorDiff"
                            type="matrix"
                            values="
                                0 0 0 0 0
                                0 0 0 0 0
                                0 0 0 0 0
                                9 9 9 0 -0.3
                            "
                            result="colorMask"
                        />

                        {/* 4. Luminance mask: anything darker than the light grey background stays visible */}
                        <feColorMatrix
                            in="SourceGraphic"
                            type="matrix"
                            values="
                                0 0 0 0 0
                                0 0 0 0 0
                                0 0 0 0 0
                                -4.2 -4.2 -4.2 0 9.8
                            "
                            result="darkMask"
                        />

                        {/* 5. Combine colorMask and darkMask */}
                        <feComposite in="colorMask" in2="darkMask" operator="arithmetic" k2="1" k3="1" result="combinedAlpha" />

                        {/* 6. Apply transparency mask to original graphic */}
                        <feComposite in="SourceGraphic" in2="combinedAlpha" operator="in" />
                    </filter>
                </defs>
            </svg>

            {/* SVG Logo Icon */}
            <div
                className="relative shrink-0 transition-transform duration-300 group-hover:scale-105"
                style={{ width: size, height: size }}
            >
                <img
                    src="/logo.svg"
                    width={size}
                    height={size}
                    alt="MoKio Logo"
                    className="w-full h-full object-contain"
                    style={{
                        filter: "url(#mokio-logo-filter)",
                    }}
                />
            </div>

            {/* Brand Typography */}
            {showText && (
                <div className={`flex flex-col leading-tight ${textClassName}`}>
                    <span className="font-extrabold text-base tracking-tight text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        MoKio
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold -mt-0.5">
                        AI Powered
                    </span>
                </div>
            )}
        </div>
    );
}
