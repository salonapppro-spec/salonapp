"use client";

import { usePathname } from "next/navigation";

/**
 * Коренът на админ панела за текущата страница: „/admin“ за истинския панел,
 * „/demo“ за демото. Админ компонентите са едни и същи и на двете места —
 * вътрешните им линкове трябва да останат в своя раздел, иначе посетителят
 * на демото пада на екрана за вход.
 */
export function useAdminBasePath(): "/admin" | "/demo" {
  const pathname = usePathname() ?? "";
  return pathname === "/demo" || pathname.startsWith("/demo/") ? "/demo" : "/admin";
}
