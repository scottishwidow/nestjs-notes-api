import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.constants';
import { AuditEvent, AuditEventType } from './audit.types';

export interface AuditRepository {
  record(
    noteId: string,
    type: AuditEventType,
    meta?: Record<string, unknown>,
  ): Promise<AuditEvent>;
  list(noteId?: string): Promise<AuditEvent[]>;
}

export const AUDIT_REPOSITORY = Symbol('AUDIT_REPOSITORY');

type AuditRow = {
  id: string;
  note_id: string;
  type: AuditEventType;
  at: Date | string;
  meta: Record<string, unknown> | null;
};

function toIso(value: Date | string) {
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}

function mapAudit(row: AuditRow): AuditEvent {
  return {
    id: row.id,
    noteId: row.note_id,
    type: row.type,
    at: toIso(row.at),
    meta: row.meta ?? undefined,
  };
}

@Injectable()
export class PgAuditRepository implements AuditRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async record(
    noteId: string,
    type: AuditEventType,
    meta?: Record<string, unknown>,
  ) {
    const id = randomUUID();
    const at = new Date().toISOString();
    const result = await this.pool.query<AuditRow>(
      `INSERT INTO audit_events (id, note_id, type, at, meta)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, note_id, type, at, meta`,
      [id, noteId, type, at, meta ?? null],
    );

    return mapAudit(result.rows[0]);
  }

  async list(noteId?: string) {
    const values: string[] = [];
    const where = noteId ? 'WHERE note_id = $1' : '';
    if (noteId) values.push(noteId);

    const result = await this.pool.query<AuditRow>(
      `SELECT id, note_id, type, at, meta
       FROM audit_events
       ${where}
       ORDER BY at DESC`,
      values,
    );

    return result.rows.map(mapAudit);
  }
}

export class InMemoryAuditRepository implements AuditRepository {
  private readonly events: AuditEvent[] = [];

  record(
    noteId: string,
    type: AuditEventType,
    meta?: Record<string, unknown>,
  ) {
    const event: AuditEvent = {
      id: `evt_${Math.random().toString(16).slice(2)}_${Date.now()}`,
      noteId,
      type,
      at: new Date().toISOString(),
      meta,
    };
    this.events.unshift(event);
    return Promise.resolve(event);
  }

  list(noteId?: string) {
    if (!noteId) return Promise.resolve(this.events);
    return Promise.resolve(this.events.filter((e) => e.noteId === noteId));
  }
}
