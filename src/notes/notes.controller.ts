import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyGuard } from '../common/api-key.guard';
import { CreateNoteDto } from './dto/create-note.dto';
import { ListNotesQuery } from './dto/list-notes.query';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NotesService } from './notes.service';

@Controller('/notes')
export class NotesController {
  constructor(private readonly notes: NotesService) {}

  @Get()
  list(@Query() query: ListNotesQuery) {
    const published =
      query.published === undefined
        ? undefined
        : query.published.toLowerCase() === 'true';

    return this.notes.list({
      limit: query.limit ?? 20,
      offset: query.offset ?? 0,
      q: query.q,
      tag: query.tag,
      published,
    });
  }

  @Get('/:id')
  get(@Param('id') id: string) {
    return this.notes.get(id);
  }

  @UseGuards(ApiKeyGuard)
  @Post()
  create(@Body() dto: CreateNoteDto) {
    return this.notes.create(dto);
  }

  @UseGuards(ApiKeyGuard)
  @Patch('/:id')
  update(@Param('id') id: string, @Body() dto: UpdateNoteDto) {
    return this.notes.update(id, dto);
  }

  @UseGuards(ApiKeyGuard)
  @Delete('/:id')
  remove(@Param('id') id: string) {
    return this.notes.remove(id);
  }

  @UseGuards(ApiKeyGuard)
  @Post('/:id/publish')
  publish(@Param('id') id: string, @Body() body: { published: boolean }) {
    return this.notes.setPublished(id, Boolean(body?.published));
  }
}
