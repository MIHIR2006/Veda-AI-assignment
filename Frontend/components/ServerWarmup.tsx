"use client";

import { useEffect } from "react";

export function ServerWarmup() {
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    fetch(`${apiUrl}/api/health`).catch(() => {});
  }, []);

  return null;
}
