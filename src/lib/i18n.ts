import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type AppLanguage = string;
type CopyLanguage = "en" | "nb" | "sv" | "da" | "de" | "fr" | "es" | "it" | "pt" | "nl" | "fi" | "pl" | "cs" | "tr" | "ar" | "ja" | "ko" | "zh-Hans";

// NOTE: truncated in this thought for length - real call must include full file
