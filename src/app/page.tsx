"use client";

import Link from "next/link";
import Image from "next/image";
import { textsTR } from "@/lib/texts.tr";
import { useState } from "react";

type Language = "tr" | "en";

export default function Home() {
  const [language, setLanguage] = useState<Language>("tr");

  const homeTexts = {
    tr: {
      title: textsTR.home.title,
      mainSlogan: textsTR.home.mainSlogan,
      mainSloganEn: textsTR.home.mainSloganEn,
      description: textsTR.home.description,
      primaryCta: textsTR.home.primaryCta,
      secondaryCta: textsTR.home.secondaryCta,
    },
    en: {
      title: textsTR.home.title,
      mainSlogan: textsTR.home.mainSloganEn,
      mainSloganEn: textsTR.home.mainSlogan,
      description: textsTR.home.descriptionEn,
      primaryCta: textsTR.home.primaryCtaEn,
      secondaryCta: textsTR.home.secondaryCtaEn,
    },
  };

  const texts = homeTexts[language];

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-black to-zinc-900" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03),transparent_70%)]" />
      
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col px-4 sm:px-6 pt-0 pb-4 sm:pb-6">
        {/* Language Selector - Top Right */}
        <div className="flex justify-end mb-0">
          <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 p-1">
            <button
              onClick={() => setLanguage("tr")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                language === "tr"
                  ? "bg-white text-black"
                  : "text-white/70 hover:text-white"
              }`}
            >
              TR
            </button>
            <button
              onClick={() => setLanguage("en")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                language === "en"
                  ? "bg-white text-black"
                  : "text-white/70 hover:text-white"
              }`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Hero Section - Split 50/50, Image Left, Title & Slogan Right */}
        <div className="flex flex-col lg:flex-row items-center lg:items-center gap-4 sm:gap-6 lg:gap-8 mb-3 sm:mb-4 -mt-2 sm:-mt-1">
          {/* Logo and Mascot Image - Left Side (50%) */}
          <div className="w-full lg:w-1/2 flex items-center justify-center">
            <div className="w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 xl:w-[28rem] xl:h-[28rem] relative">
              <Image
                src="/logo-mascot.png"
                alt={textsTR.a11y.appLogoAlt}
                width={448}
                height={448}
                priority
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Title and Slogan - Right Side (50%) */}
          <div className="w-full lg:w-1/2 flex flex-col items-center justify-center text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight mb-2 sm:mb-3 bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-transparent">
              {texts.title}
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-zinc-300 tracking-wide mb-1">
              {texts.mainSlogan}
            </p>
            <p className="text-sm sm:text-base lg:text-lg text-zinc-500 font-medium">
              {texts.mainSloganEn}
            </p>
          </div>
        </div>

        {/* Description and CTA - Compact Layout */}
        <div className="w-full max-w-4xl mx-auto">
          {/* Description */}
          <div className="mb-4 sm:mb-5">
            <div className="space-y-2 sm:space-y-3 text-sm sm:text-base lg:text-lg text-zinc-300 leading-relaxed text-center">
              {texts.description.split('\n').map((paragraph, index) => (
                <p key={index} className={index === 0 ? "font-semibold text-white" : ""}>
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <Link
              href="/login"
              className="group w-full sm:w-auto min-w-[200px] inline-flex items-center justify-center rounded-2xl bg-white text-black px-8 py-4 sm:px-10 sm:py-5 text-base sm:text-lg font-bold hover:bg-zinc-200 active:scale-95 transition-all duration-200 shadow-lg shadow-white/20 hover:shadow-white/30"
            >
              <span>{texts.primaryCta}</span>
              <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <Link
              href="/dashboard"
              className="group w-full sm:w-auto min-w-[200px] inline-flex items-center justify-center rounded-2xl border-2 border-white/20 bg-white/5 px-8 py-4 sm:px-10 sm:py-5 text-base sm:text-lg font-bold text-white hover:bg-white/10 hover:border-white/30 active:scale-95 transition-all duration-200"
            >
              {texts.secondaryCta}
            </Link>
          </div>
        </div>

        {/* Footer decoration */}
        <div className="mt-8 sm:mt-10 text-center">
          <p className="text-sm sm:text-base text-zinc-600 font-medium">
            5N 1Dedektif
          </p>
        </div>
      </main>
    </div>
  );
}
