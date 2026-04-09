import { requireRole } from "@/lib/auth-utils";
import { getWeekSchedule } from "@/lib/queries/schedule";
import { WeekCalendar } from "@/components/client/week-calendar";

export default async function SchedulePage() {
  const session = await requireRole("CLIENT");
  const data = await getWeekSchedule(session.user.id, 0);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">🗓️ Nedeljni raspored</h1>
      <WeekCalendar initialDays={data.days} initialOffset={0} />
    </div>
  );
}
