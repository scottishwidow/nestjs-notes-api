import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuditController } from './audit.controller';
import { AUDIT_REPOSITORY, PgAuditRepository } from './audit.repository';
import { AuditService } from './audit.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AuditController],
  providers: [
    AuditService,
    {
      provide: AUDIT_REPOSITORY,
      useClass: PgAuditRepository,
    },
  ],
  exports: [AuditService],
})
export class AuditModule {}
