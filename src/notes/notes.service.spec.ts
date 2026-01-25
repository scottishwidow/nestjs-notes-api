import { AuditService } from '../audit/audit.service';
import { NotesService } from './notes.service';

describe('NotesService', () => {
  let audit: AuditService;
  let service: NotesService;

  beforeEach(() => {
    audit = new AuditService();
    service = new NotesService(audit);
  });

  it('creates notes with trimmed fields', () => {
    const note = service.create({
      title: '  Hello  ',
      content: '  World  ',
      tags: [' x ', ''],
    });

    expect(note.title).toBe('Hello');
    expect(note.content).toBe('World');
    expect(note.tags).toEqual(['x']);
    expect(note.published).toBe(false);
  });

  it('publishes notes and records audit events', () => {
    const note = service.create({ title: 'Title', content: 'Content' });
    const updated = service.setPublished(note.id, true);
    expect(updated.published).toBe(true);

    const events = audit.list(note.id);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('NOTE_PUBLISHED');
  });

  it('removes notes and records delete events', () => {
    const note = service.create({ title: 'Bye', content: 'Bye' });
    const res = service.remove(note.id);
    expect(res.ok).toBe(true);

    const events = audit.list(note.id);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('NOTE_DELETED');
  });
});
