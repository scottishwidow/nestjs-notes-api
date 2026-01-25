import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { Note } from './notes.types';

function uid(prefix = 'note') {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

@Injectable()
export class NotesService {
  private readonly notes = new Map<string, Note>();

  constructor(private readonly audit: AuditService) {
    const now = new Date().toISOString();
    const seed: Note = {
      id: uid(),
      title: 'Welcome note',
      content: 'This is a seeded note for the CI demo app.',
      tags: ['demo', 'ci'],
      published: true,
      createdAt: now,
      updatedAt: now,
    };
    this.notes.set(seed.id, seed);
  }

  list(params: {
    limit: number;
    offset: number;
    q?: string;
    tag?: string;
    published?: boolean;
  }) {
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
    return { total, items };
  }

  get(id: string) {
    const note = this.notes.get(id);
    if (!note) throw new NotFoundException('Note not found');
    return note;
  }

  create(dto: CreateNoteDto) {
    const now = new Date().toISOString();
    const note: Note = {
      id: uid(),
      title: dto.title.trim(),
      content: dto.content.trim(),
      tags: (dto.tags ?? []).map((t) => t.trim()).filter(Boolean),
      published: false,
      createdAt: now,
      updatedAt: now,
    };
    this.notes.set(note.id, note);
    return note;
  }

  update(id: string, dto: UpdateNoteDto) {
    const prev = this.get(id);
    const next: Note = {
      ...prev,
      title: dto.title !== undefined ? dto.title.trim() : prev.title,
      content: dto.content !== undefined ? dto.content.trim() : prev.content,
      tags:
        dto.tags !== undefined
          ? dto.tags.map((t) => t.trim()).filter(Boolean)
          : prev.tags,
      published: dto.published !== undefined ? dto.published : prev.published,
      updatedAt: new Date().toISOString(),
    };
    this.notes.set(id, next);
    return next;
  }

  remove(id: string) {
    const note = this.get(id);
    this.notes.delete(id);
    this.audit.record(id, 'NOTE_DELETED', { title: note.title });
    return { ok: true };
  }

  setPublished(id: string, published: boolean) {
    const note = this.get(id);
    const updated = this.update(id, { published });

    this.audit.record(id, published ? 'NOTE_PUBLISHED' : 'NOTE_UNPUBLISHED', {
      title: note.title,
    });

    return updated;
  }
}
