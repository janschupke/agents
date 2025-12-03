import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  ParseIntPipe,
  Logger,
} from '@nestjs/common';
import { SavedWordService } from './saved-word.service';
import { User } from '../auth/decorators/user.decorator';
import { AuthenticatedUser } from '../common/types/auth.types';
import { API_ROUTES } from '../common/constants/api-routes.constants.js';
import {
  CreateSavedWordDto,
  UpdateSavedWordDto,
  AddSentenceDto,
  SavedWordResponseDto,
  SavedWordSentenceResponseDto,
} from './dto/saved-word.dto';

@Controller(API_ROUTES.SAVED_WORDS.BASE)
export class SavedWordController {
  private readonly logger = new Logger(SavedWordController.name);

  constructor(private readonly savedWordService: SavedWordService) {}

  @Post()
  async createSavedWord(
    @Body() dto: CreateSavedWordDto,
    @User() user: AuthenticatedUser
  ): Promise<SavedWordResponseDto> {
    this.logger.log(`Creating saved word for user ${user.id}`);
    return this.savedWordService.createSavedWord(user.id, dto);
  }

  @Get()
  async getSavedWords(
    @User() user: AuthenticatedUser
  ): Promise<SavedWordResponseDto[]> {
    this.logger.debug(`Getting saved words for user ${user.id}`);
    return this.savedWordService.getSavedWords(user.id);
  }

  @Get('matching')
  async findMatchingWords(
    @Query('words') words: string,
    @User() user: AuthenticatedUser
  ): Promise<SavedWordResponseDto[]> {
    this.logger.debug(
      `Finding matching saved words for user ${user.id}, words: ${words}`
    );
    const wordArray = words
      ? words.split(',').map((w) => w.trim()).filter((w) => w.length > 0)
      : [];
    const matches = await this.savedWordService.findMatchingWords(
      user.id,
      wordArray
    );
    // Convert matches to full response DTOs
    const fullWords = await Promise.all(
      matches.map((match) =>
        this.savedWordService.getSavedWord(match.savedWordId, user.id)
      )
    );
    return fullWords;
  }

  @Get(':id')
  async getSavedWord(
    @Param('id', ParseIntPipe) id: number,
    @User() user: AuthenticatedUser
  ): Promise<SavedWordResponseDto> {
    this.logger.debug(`Getting saved word ${id} for user ${user.id}`);
    return this.savedWordService.getSavedWord(id, user.id);
  }

  @Patch(':id')
  async updateSavedWord(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSavedWordDto,
    @User() user: AuthenticatedUser
  ): Promise<SavedWordResponseDto> {
    this.logger.log(`Updating saved word ${id} for user ${user.id}`);
    return this.savedWordService.updateSavedWord(id, user.id, dto);
  }

  @Delete(':id')
  async deleteSavedWord(
    @Param('id', ParseIntPipe) id: number,
    @User() user: AuthenticatedUser
  ): Promise<void> {
    this.logger.log(`Deleting saved word ${id} for user ${user.id}`);
    await this.savedWordService.deleteSavedWord(id, user.id);
  }

  @Post(':id/sentences')
  async addSentence(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddSentenceDto,
    @User() user: AuthenticatedUser
  ): Promise<SavedWordSentenceResponseDto> {
    this.logger.log(
      `Adding sentence to saved word ${id} for user ${user.id}`
    );
    return this.savedWordService.addSentence(
      id,
      user.id,
      dto.sentence,
      dto.messageId
    );
  }

  @Delete(':id/sentences/:sentenceId')
  async removeSentence(
    @Param('id', ParseIntPipe) id: number,
    @Param('sentenceId', ParseIntPipe) sentenceId: number,
    @User() user: AuthenticatedUser
  ): Promise<void> {
    this.logger.log(
      `Removing sentence ${sentenceId} from saved word ${id} for user ${user.id}`
    );
    await this.savedWordService.removeSentence(sentenceId, id, user.id);
  }
}
