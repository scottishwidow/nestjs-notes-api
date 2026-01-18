import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { DatabaseModule } from '../database/database.module';
import { ApiKeyGuard } from '../common/api-key.guard';
import { NotesController } from './notes.controller';
import { PgNotesRepository, NOTES_REPOSITORY } from './notes.repository';
import { NotesService } from './notes.service';

@Module({
  imports: [AuditModule, DatabaseModule],
  controllers: [NotesController],
  providers: [
    NotesService,
    ApiKeyGuard,
    {
      provide: NOTES_REPOSITORY,
      useClass: PgNotesRepository,
    },
  ],
})
export class NotesModule {}
