import type { Request } from "express";

function firstIp(value: string | string[] | undefined): string | null {
  if (!value) return null;
  const raw = Array.isArray(value) ? value[0] : value;
  const ip = raw.split(",")[0]?.trim();
  return ip || null;
}

function normalizeIp(ip: string): string {
  return ip.startsWith("::ffff:") ? ip.slice(7) : ip;
}

/** Best-effort client IP for logging / anti-cheat. Public IP in prod behind a proxy. */
export function getClientIp(req: Request): string {
  const ip =
    firstIp(req.headers["cf-connecting-ip"]) ??
    firstIp(req.headers["x-real-ip"]) ??
    firstIp(req.headers["x-forwarded-for"]) ??
    req.ip ??
    req.socket.remoteAddress;

  return ip ? normalizeIp(ip) : "unknown";
}
