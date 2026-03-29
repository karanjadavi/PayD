import { pool } from '../config/database.js';
import logger from '../utils/logger.js';

export interface PayrollSchedule {
  id: number;
  organization_id: number;
  name: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  cron_expression: string;
  timezone: string;
  asset_code: string;
  is_active: boolean;
  last_run_at: Date | null;
  next_run_at: Date | null;
  missed_runs_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateScheduleInput {
  organization_id: number;
  name: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  timezone?: string;
  asset_code?: string;
}

const FREQUENCY_CRON_MAP: Record<string, string> = {
  weekly: '0 9 * * 1',      // Every Monday at 9:00 AM
  biweekly: '0 9 * * 1',    // Every Monday at 9:00 AM (handled with job key)
  monthly: '0 9 1 * *',     // 1st of every month at 9:00 AM
};

export class PayrollScheduleService {
  static getCronForFrequency(frequency: string): string {
    return FREQUENCY_CRON_MAP[frequency] || FREQUENCY_CRON_MAP['monthly']!;
  }

  static async create(input: CreateScheduleInput): Promise<PayrollSchedule> {
    const cronExpression = this.getCronForFrequency(input.frequency);
    const result = await pool.query(
      `INSERT INTO payroll_schedules (organization_id, name, frequency, cron_expression, timezone, asset_code)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        input.organization_id,
        input.name,
        input.frequency,
        cronExpression,
        input.timezone || 'UTC',
        input.asset_code || 'XLM',
      ]
    );
    logger.info(`Created payroll schedule "${input.name}" for org ${input.organization_id}`);
    return result.rows[0];
  }

  static async getById(id: number): Promise<PayrollSchedule | null> {
    const result = await pool.query('SELECT * FROM payroll_schedules WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async listByOrganization(
    organizationId: number,
    activeOnly: boolean = false
  ): Promise<PayrollSchedule[]> {
    let query = 'SELECT * FROM payroll_schedules WHERE organization_id = $1';
    const params: (number | boolean)[] = [organizationId];

    if (activeOnly) {
      query += ' AND is_active = true';
    }

    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async update(id: number, updates: Partial<PayrollSchedule>): Promise<PayrollSchedule | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.frequency !== undefined) {
      fields.push(`frequency = $${paramIndex++}`);
      values.push(updates.frequency);
      fields.push(`cron_expression = $${paramIndex++}`);
      values.push(this.getCronForFrequency(updates.frequency));
    }
    if (updates.timezone !== undefined) {
      fields.push(`timezone = $${paramIndex++}`);
      values.push(updates.timezone);
    }
    if (updates.asset_code !== undefined) {
      fields.push(`asset_code = $${paramIndex++}`);
      values.push(updates.asset_code);
    }
    if (updates.is_active !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(updates.is_active);
    }

    if (fields.length === 0) return this.getById(id);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE payroll_schedules SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async deactivate(id: number): Promise<PayrollSchedule | null> {
    return this.update(id, { is_active: false } as any);
  }

  static async delete(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM payroll_schedules WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  static async recordRun(id: number): Promise<void> {
    await pool.query(
      `UPDATE payroll_schedules SET last_run_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [id]
    );
  }

  static async recordMissedRun(id: number): Promise<void> {
    await pool.query(
      `UPDATE payroll_schedules SET missed_runs_count = missed_runs_count + 1, updated_at = NOW() WHERE id = $1`,
      [id]
    );
  }

  static async getActiveSchedules(): Promise<PayrollSchedule[]> {
    const result = await pool.query(
      `SELECT * FROM payroll_schedules WHERE is_active = true ORDER BY next_run_at ASC NULLS FIRST`
    );
    return result.rows;
  }

  static async hasRunToday(scheduleId: number): Promise<boolean> {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM payroll_runs pr
       JOIN payroll_schedules ps ON pr.organization_id = ps.organization_id
       WHERE ps.id = $1 AND pr.created_at >= CURRENT_DATE`,
      [scheduleId]
    );
    return parseInt(result.rows[0].count, 10) > 0;
  }
}
