import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import {
  NOTES_REPOSITORY,
  NotesRepository,
} from './notes.repository';
import { Note } from './notes.types';

@Injectable()
export class NotesService {
  constructor(
    private readonly audit: AuditService,
    @Inject(NOTES_REPOSITORY) private readonly notesRepo: NotesRepository,
  ) {}

  list(params: {
    limit: number;
    offset: number;
    q?: string;
    tag?: string;
    published?: boolean;
  }) {
    return this.notesRepo.list(params);
  }

  async get(id: string) {
    const note = await this.notesRepo.get(id);
    if (!note) throw new NotFoundException('Note not found');
    return note;
  }

  async create(dto: CreateNoteDto) {
    const now = new Date().toISOString();
    const note: Note = {
      id: randomUUID(),
      title: dto.title.trim(),
      content: dto.content.trim(),
      tags: (dto.tags ?? []).map((t) => t.trim()).filter(Boolean),
      published: false,
      createdAt: now,
      updatedAt: now,
    };
    await this.notesRepo.create(note);
    return note;
  }

  async update(id: string, dto: UpdateNoteDto, prev?: Note) {
    const current = prev ?? (await this.get(id));
    const next: Note = {
      ...current,
      title: dto.title !== undefined ? dto.title.trim() : current.title,
      content: dto.content !== undefined ? dto.content.trim() : current.content,
      tags:
        dto.tags !== undefined
          ? dto.tags.map((t) => t.trim()).filter(Boolean)
          : current.tags,
      published:
        dto.published !== undefined ? dto.published : current.published,
      updatedAt: new Date().toISOString(),
    };
    await this.notesRepo.update(next);
    return next;
  }

  async remove(id: string) {
    const note = await this.get(id);
    await this.notesRepo.remove(id);
    await this.audit.record(id, 'NOTE_DELETED', { title: note.title });
    return { ok: true };
  }

  async setPublished(id: string, published: boolean) {
    const note = await this.get(id);
    const updated = await this.update(id, { published }, note);

    await this.audit.record(
      id,
      published ? 'NOTE_PUBLISHED' : 'NOTE_UNPUBLISHED',
      { title: note.title },
    );

    return updated;
  }
}
