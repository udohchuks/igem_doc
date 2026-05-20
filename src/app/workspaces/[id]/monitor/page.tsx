import { db } from "@/lib/db/client";
import { apiLogs, workspaces } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MonitorClient } from "@/components/MonitorClient";

export const dynamic = "force-dynamic";

export default async function MonitorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: workspaceId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Ensure workspace exists
  const ws = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (ws.length === 0) {
    return redirect("/workspaces");
  }

  // Fetch recent logs
  const recentLogs = await db
    .select()
    .from(apiLogs)
    .where(eq(apiLogs.workspaceId, workspaceId))
    .orderBy(desc(apiLogs.createdAt))
    .limit(100);

  // Fetch stats aggregated by service and status
  const stats = await db
    .select({
      service: apiLogs.service,
      status: apiLogs.status,
      count: sql<number>`count(*)::int`,
      avgLatency: sql<number>`avg(${apiLogs.latencyMs})::int`,
    })
    .from(apiLogs)
    .where(eq(apiLogs.workspaceId, workspaceId))
    .groupBy(apiLogs.service, apiLogs.status);

  // Map database dates to JS Date objects for Client side component serialization
  const serializedLogs = recentLogs.map((log) => ({
    id: log.id,
    service: log.service,
    endpoint: log.endpoint,
    status: log.status,
    latencyMs: log.latencyMs,
    tokensUsed: log.tokensUsed,
    errorMessage: log.errorMessage,
    createdAt: new Date(log.createdAt),
  }));

  const serializedStats = stats.map((stat) => ({
    service: stat.service,
    status: stat.status,
    count: stat.count,
    avgLatency: stat.avgLatency,
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <MonitorClient
        workspaceId={workspaceId}
        initialLogs={serializedLogs}
        initialStats={serializedStats}
      />
    </div>
  );
}
