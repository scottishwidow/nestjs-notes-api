import { InMemoryAuditRepository } from './audit.repository';
import { AuditService } from './audit.service';

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(() => {
    service = new AuditService(new InMemoryAuditRepository());
  });

  it('records and lists audit events', async () => {
    await service.record('note-1', 'NOTE_PUBLISHED', { user: 'dev' });
    const list = await service.list();
    expect(list).toHaveLength(1);
    expect(list[0].noteId).toBe('note-1');
    expect(list[0].type).toBe('NOTE_PUBLISHED');
  });

  it('filters by noteId', async () => {
    await service.record('note-1', 'NOTE_PUBLISHED');
    await service.record('note-2', 'NOTE_DELETED');
    const list = await service.list('note-2');
    expect(list).toHaveLength(1);
    expect(list[0].noteId).toBe('note-2');
  });
});
