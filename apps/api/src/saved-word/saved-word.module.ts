import { Module } from '@nestjs/common';
import { SavedWordController } from './saved-word.controller';
import { SavedWordService } from './saved-word.service';
import { SavedWordRepository } from './saved-word.repository';
import { PinyinService } from './pinyin.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SavedWordController],
  providers: [SavedWordService, SavedWordRepository, PinyinService],
  exports: [SavedWordService],
})
export class SavedWordModule {}
