import { getDatabase } from '../db/database';

export interface ReadingPlan {
  id: string;
  title: string;
  description: string;
  days_total: number;
}

export interface ReadingPlanProgress {
  plan_id: string;
  user_id: string | null;
  current_day: number;
}

export type ActiveReadingPlan = ReadingPlan & { current_day: number };

export class ReadingPlanRepository {
  static getAvailablePlans(): ReadingPlan[] {
    return getDatabase().getAllSync<ReadingPlan>(
      `SELECT id, title, description, days_total FROM reading_plans ORDER BY title ASC`
    );
  }

  static getActivePlans(userId: string | null): ActiveReadingPlan[] {
    return getDatabase().getAllSync<ActiveReadingPlan>(
      `SELECT p.id, p.title, p.description, p.days_total, pr.current_day
       FROM reading_plans p
       JOIN reading_plan_progress pr ON p.id = pr.plan_id
       WHERE pr.user_id IS ?`,
      userId
    );
  }

  static startPlan(planId: string, userId: string | null): void {
    getDatabase().runSync(
      `INSERT OR IGNORE INTO reading_plan_progress (plan_id, user_id, current_day, updated_at)
       VALUES (?, ?, 0, ?)`,
      planId, userId, new Date().toISOString()
    );
  }

  static markDayComplete(planId: string, userId: string | null, day: number): void {
    getDatabase().runSync(
      `UPDATE reading_plan_progress 
       SET current_day = ?, updated_at = ?
       WHERE plan_id = ? AND user_id IS ?`,
      day, new Date().toISOString(), planId, userId
    );
  }
}
