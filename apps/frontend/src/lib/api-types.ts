export interface Module {
  id: string;
  title: string;
  description: string;
  orderIndex: number;
  locked: boolean;
}

export interface ModuleProgress {
  lessonsCompleted: number;
  lessonsTotal: number;
  quizBestScore: number | null;
  quizPassed: boolean;
  status: "locked" | "in_progress" | "completed";
}

export interface ProgressData {
  modules: Record<string, ModuleProgress>;
}

export function statusBadgeClass(status: string): string {
  const variant =
    status === "locked"
      ? "badge--locked"
      : status === "completed"
        ? "badge--complete"
        : "badge--progress";
  return `badge ${variant}`;
}

export function progressPercent(completed: number, total: number): string {
  return total > 0 ? `${(completed / total) * 100}%` : "0%";
}
