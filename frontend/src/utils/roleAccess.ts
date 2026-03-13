export type AppRole = "administrador" | "contador" | string;

export const DEFAULT_CONTADOR_ROUTE = "/admin/finanzas/balances";

export const CONTADOR_ALLOWED_ROUTES = [
  "/admin/finanzas/pagos",
  "/admin/finanzas/gastos",
  "/admin/finanzas/deudores",
  "/admin/finanzas/balances",
] as const;

const normalizePath = (path: string): string => {
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
};

export const isRouteAllowedByRole = (role: AppRole, pathname: string): boolean => {
  if (role !== "contador") {
    return true;
  }

  const normalizedPathname = normalizePath(pathname);
  return CONTADOR_ALLOWED_ROUTES.includes(normalizedPathname as (typeof CONTADOR_ALLOWED_ROUTES)[number]);
};
