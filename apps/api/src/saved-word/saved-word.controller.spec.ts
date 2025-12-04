import { Test, TestingModule } from '@nestjs/testing';
import { SavedWordController } from './saved-word.controller';
import { SavedWordService } from './saved-word.service';
import {
  CreateSavedWordDto,
  UpdateSavedWordDto,
  AddSentenceDto,
} from './dto/saved-word.dto';

describe('SavedWordController', () => {
  let controller: SavedWordController;
  let service: jest.Mocked<SavedWordService>;

  const mockService = {
    createSavedWord: jest.fn(),
    getSavedWordsByLanguage: jest.fn(),
    findMatchingWords: jest.fn(),
    getSavedWord: jest.fn(),
    updateSavedWord: jest.fn(),
    deleteSavedWord: jest.fn(),
    addSentence: jest.fn(),
    removeSentence: jest.fn(),
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    imageUrl: null,
    roles: ['user'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SavedWordController],
      providers: [
        {
          provide: SavedWordService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<SavedWordController>(SavedWordController);
    service = module.get(SavedWordService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createSavedWord', () => {
    it('should create a saved word', async () => {
      const createDto: CreateSavedWordDto = {
        originalWord: '你好',
        translation: 'Hello',
        pinyin: 'nǐ hǎo',
      };

      const mockCreated = {
        id: 1,
        ...createDto,
        userId: mockUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      service.createSavedWord.mockResolvedValue(mockCreated as any);

      const result = await controller.createSavedWord(createDto, mockUser);

      expect(result).toEqual(mockCreated);
      expect(service.createSavedWord).toHaveBeenCalledWith(
        mockUser.id,
        createDto
      );
    });
  });

  describe('getSavedWords', () => {
    it('should return saved words for user', async () => {
      const mockWords = [
        {
          id: 1,
          originalWord: '你好',
          translation: 'Hello',
          userId: mockUser.id,
        },
      ];

      service.getSavedWordsByLanguage.mockResolvedValue(mockWords as any);

      const result = await controller.getSavedWords(mockUser);

      expect(result).toEqual(mockWords);
      expect(service.getSavedWordsByLanguage).toHaveBeenCalledWith(
        mockUser.id,
        undefined
      );
    });

    it('should filter by language when provided', async () => {
      const mockWords = [];
      service.getSavedWordsByLanguage.mockResolvedValue(mockWords);

      const result = await controller.getSavedWords(mockUser, 'zh');

      expect(result).toEqual(mockWords);
      expect(service.getSavedWordsByLanguage).toHaveBeenCalledWith(
        mockUser.id,
        'zh'
      );
    });
  });

  describe('findMatchingWords', () => {
    it('should find matching words', async () => {
      const mockMatches = [
        { savedWordId: 1, originalWord: '你好', translation: 'Hello' },
      ];
      const mockFullWords = [
        {
          id: 1,
          originalWord: '你好',
          translation: 'Hello',
          userId: mockUser.id,
        },
      ];

      service.findMatchingWords.mockResolvedValue(mockMatches as any);
      service.getSavedWord.mockResolvedValue(mockFullWords[0] as any);

      const result = await controller.findMatchingWords('你好,世界', mockUser);

      expect(result).toBeDefined();
      expect(service.findMatchingWords).toHaveBeenCalledWith(mockUser.id, [
        '你好',
        '世界',
      ]);
    });

    it('should handle empty words query', async () => {
      service.findMatchingWords.mockResolvedValue([]);

      const result = await controller.findMatchingWords('', mockUser);

      expect(result).toEqual([]);
      expect(service.findMatchingWords).toHaveBeenCalledWith(mockUser.id, []);
    });
  });

  describe('getSavedWord', () => {
    it('should return a single saved word', async () => {
      const mockWord = {
        id: 1,
        originalWord: '你好',
        translation: 'Hello',
        userId: mockUser.id,
      };

      service.getSavedWord.mockResolvedValue(mockWord as any);

      const result = await controller.getSavedWord(1, mockUser);

      expect(result).toEqual(mockWord);
      expect(service.getSavedWord).toHaveBeenCalledWith(1, mockUser.id);
    });
  });

  describe('updateSavedWord', () => {
    it('should update a saved word', async () => {
      const updateDto: UpdateSavedWordDto = {
        translation: 'Updated translation',
      };

      const mockUpdated = {
        id: 1,
        originalWord: '你好',
        ...updateDto,
        userId: mockUser.id,
      };

      service.updateSavedWord.mockResolvedValue(mockUpdated as any);

      const result = await controller.updateSavedWord(1, updateDto, mockUser);

      expect(result).toEqual(mockUpdated);
      expect(service.updateSavedWord).toHaveBeenCalledWith(
        1,
        mockUser.id,
        updateDto
      );
    });
  });

  describe('deleteSavedWord', () => {
    it('should delete a saved word', async () => {
      service.deleteSavedWord.mockResolvedValue(undefined);

      await controller.deleteSavedWord(1, mockUser);

      expect(service.deleteSavedWord).toHaveBeenCalledWith(1, mockUser.id);
    });
  });

  describe('addSentence', () => {
    it('should add a sentence to a saved word', async () => {
      const addSentenceDto: AddSentenceDto = {
        sentence: '你好世界',
        messageId: 1,
      };

      const mockSentence = {
        id: 1,
        savedWordId: 1,
        ...addSentenceDto,
        createdAt: new Date(),
      };

      service.addSentence.mockResolvedValue(mockSentence as any);

      const result = await controller.addSentence(1, addSentenceDto, mockUser);

      expect(result).toEqual(mockSentence);
      expect(service.addSentence).toHaveBeenCalledWith(
        1,
        mockUser.id,
        addSentenceDto.sentence,
        addSentenceDto.messageId
      );
    });
  });

  describe('removeSentence', () => {
    it('should remove a sentence from a saved word', async () => {
      service.removeSentence.mockResolvedValue(undefined);

      await controller.removeSentence(1, 10, mockUser);

      expect(service.removeSentence).toHaveBeenCalledWith(10, 1, mockUser.id);
    });
  });
});
