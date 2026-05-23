"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase-admin";

function isSuperAdminRole(user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }): boolean {
  return user.app_metadata?.role === "super_admin";
}

async function requireSuperAdminUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Unauthorized");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isSuperAdminRole(user)) throw new Error("Unauthorized");
  return user;
}

export async function markCallTaskCalledAction(formData: FormData): Promise<void> {
  await requireSuperAdminUser();
  const taskId = String(formData.get("task_id") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim() || null;
  const nextCallAt = String(formData.get("next_call_at") ?? "").trim() || null;
  if (!taskId) throw new Error("Missing task_id");

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("lead_call_tasks")
    .update({
      status: "called",
      last_called_at: new Date().toISOString(),
      note,
      next_call_at: nextCallAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);
  if (error) throw new Error(`Неуспешно записване: ${error.message}`);

  revalidatePath("/super-admin/leads");
  redirect("/super-admin/leads?op=called");
}

export async function snoozeCallTaskAction(formData: FormData): Promise<void> {
  await requireSuperAdminUser();
  const taskId = String(formData.get("task_id") ?? "").trim();
  if (!taskId) throw new Error("Missing task_id");

  const d = new Date();
  d.setDate(d.getDate() + 2);
  const nextCallAt = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("lead_call_tasks")
    .update({
      status: "no_answer",
      next_call_at: nextCallAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);
  if (error) throw new Error(`Неуспешно отлагане: ${error.message}`);

  revalidatePath("/super-admin/leads");
  redirect("/super-admin/leads?op=snoozed");
}

export async function closeCallTaskAction(formData: FormData): Promise<void> {
  await requireSuperAdminUser();
  const taskId = String(formData.get("task_id") ?? "").trim();
  if (!taskId) throw new Error("Missing task_id");

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("lead_call_tasks")
    .update({
      status: "closed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);
  if (error) throw new Error(`Неуспешно затваряне: ${error.message}`);

  revalidatePath("/super-admin/leads");
  redirect("/super-admin/leads?op=closed");
}

export async function deleteLeadAction(formData: FormData): Promise<void> {
  await requireSuperAdminUser();
  const leadId = String(formData.get("lead_id") ?? "").trim();
  if (!leadId) throw new Error("Missing lead_id");

  const supabase = createSupabaseServiceRoleClient();
  // Call tasks are deleted first (FK constraint).
  await supabase.from("lead_call_tasks").delete().eq("lead_id", leadId);
  const { error } = await supabase.from("platform_leads").delete().eq("id", leadId);
  if (error) throw new Error(`Неуспешно изтриване: ${error.message}`);

  revalidatePath("/super-admin/leads");
  redirect("/super-admin/leads?op=lead_deleted");
}
