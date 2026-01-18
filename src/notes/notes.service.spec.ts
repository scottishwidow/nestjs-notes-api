import { InMemoryAuditRepository } from '../audit/audit.repository';
import { AuditService } from '../audit/audit.service';
import { InMemoryNotesRepository } from './notes.repository';
import { NotesService } from './notes.service';

describe('NotesService', () => {
  let audit: AuditService;
  let service: NotesService;

  beforeEach(() => {
    audit = new AuditService(new InMemoryAuditRepository());
    service = new NotesService(audit, new InMemoryNotesRepository());
  });

  it('creates notes with trimmed fields', async () => {
    const note = await service.create({
      title: '  Hello  ',
      content: '  World  ',
      tags: [' x ', ''],
    });

    expect(note.title).toBe('Hello');
    expect(note.content).toBe('World');
    expect(note.tags).toEqual(['x']);
    expect(note.published).toBe(false);
  });

  it('publishes notes and records audit events', async () => {
    const note = await service.create({ title: 'Title', content: 'Content' });
    const updated = await service.setPublished(note.id, true);
    expect(updated.published).toBe(true);

    const events = await audit.list(note.id);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('NOTE_PUBLISHED');
  });

  it('removes notes and records delete events', async () => {
    const note = await service.create({ title: 'Bye', content: 'Bye' });
    const res = await service.remove(note.id);
    expect(res.ok).toBe(true);

    const events = await audit.list(note.id);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('NOTE_DELETED');
  });
});
