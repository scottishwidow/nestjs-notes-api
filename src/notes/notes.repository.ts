import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.constants';
import { Note } from './notes.types';

export type ListNotesParams = {
  limit: number;
  offset: number;
  q?: string;
  tag?: string;
  published?: boolean;
};

export interface NotesRepository {
  list(params: ListNotesParams): Promise<{ total: number; items: Note[] }>;
  get(id: string): Promise<Note | null>;
  create(note: Note): Promise<Note>;
  update(note: Note): Promise<Note>;
  remove(id: string): Promise<void>;
}

export const NOTES_REPOSITORY = Symbol('NOTES_REPOSITORY');

type NoteRow = {
  id: string;
  title: string;
  content: string;
  tags: string[] | null;
  published: boolean;
  created_at: Date | string;
  updated_at: Date | string;
};

function toIso(value: Date | string) {
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}

function mapNote(row: NoteRow): Note {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    tags: row.tags ?? [],
    published: row.published,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

@Injectable()
export class PgNotesRepository implements NotesRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async list(params: ListNotesParams) {
    const clauses: string[] = [];
    const values: Array<string | number | boolean> = [];

    if (typeof params.published === 'boolean') {
      values.push(params.published);
      clauses.push(`published = $${values.length}`);
    }
    if (params.tag) {
      values.push(params.tag);
      clauses.push(`$${values.length} = ANY(tags)`);
    }
    if (params.q) {
      values.push(`%${params.q}%`);
      clauses.push(
        `(title ILIKE $${values.length} OR content ILIKE $${values.length})`,
      );
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const totalResult = await this.pool.query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM notes ${where}`,
      values,
    );

    const offsetParam = values.length + 1;
    const limitParam = values.length + 2;
    const itemsResult = await this.pool.query<NoteRow>(
      `SELECT id, title, content, tags, published, created_at, updated_at
       FROM notes
       ${where}
       ORDER BY created_at DESC
       OFFSET $${offsetParam} LIMIT $${limitParam}`,
      [...values, params.offset, params.limit],
    );

    return {
      total: Number(totalResult.rows[0]?.total ?? 0),
      items: itemsResult.rows.map(mapNote),
    };
  }

  async get(id: string) {
    const result = await this.pool.query<NoteRow>(
      `SELECT id, title, content, tags, published, created_at, updated_at
       FROM notes
       WHERE id = $1`,
      [id],
    );
    if (!result.rows[0]) return null;
    return mapNote(result.rows[0]);
  }

  async create(note: Note) {
    await this.pool.query(
      `INSERT INTO notes (id, title, content, tags, published, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        note.id,
        note.title,
        note.content,
        note.tags,
        note.published,
        note.createdAt,
        note.updatedAt,
      ],
    );
    return note;
  }

  async update(note: Note) {
    await this.pool.query(
      `UPDATE notes
       SET title = $2,
           content = $3,
           tags = $4,
           published = $5,
           updated_at = $6
       WHERE id = $1`,
      [
        note.id,
        note.title,
        note.content,
        note.tags,
        note.published,
        note.updatedAt,
      ],
    );
    return note;
  }

  async remove(id: string) {
    await this.pool.query(`DELETE FROM notes WHERE id = $1`, [id]);
  }
}

export class InMemoryNotesRepository implements NotesRepository {
  private readonly notes = new Map<string, Note>();

  list(params: ListNotesParams) {
    const all = Array.from(this.notes.values());
    const filtered = all.filter((n) => {
      if (
        typeof params.published === 'boolean' &&
        n.published !== params.published
      )
        return false;
      if (params.tag && !n.tags.includes(params.tag)) return false;
      if (params.q) {
        const q = params.q.toLowerCase();
        const hay = `${n.title}\n${n.content}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const total = filtered.length;
    const items = filtered.slice(params.offset, params.offset + params.limit);
    return Promise.resolve({ total, items });
  }

  get(id: string) {
    return Promise.resolve(this.notes.get(id) ?? null);
  }

  create(note: Note) {
    this.notes.set(note.id, note);
    return Promise.resolve(note);
  }

  update(note: Note) {
    this.notes.set(note.id, note);
    return Promise.resolve(note);
  }

  remove(id: string) {
    this.notes.delete(id);
    return Promise.resolve();
  }
}
