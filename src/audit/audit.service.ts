import { Inject, Injectable } from '@nestjs/common';
import {
  AUDIT_REPOSITORY,
  AuditRepository,
} from './audit.repository';
import { AuditEventType } from './audit.types';

@Injectable()
export class AuditService {
  constructor(
    @Inject(AUDIT_REPOSITORY) private readonly repo: AuditRepository,
  ) {}

  record(noteId: string, type: AuditEventType, meta?: Record<string, unknown>) {
    return this.repo.record(noteId, type, meta);
  }

  list(noteId?: string) {
    return this.repo.list(noteId);
  }
}
