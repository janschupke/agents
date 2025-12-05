import { Test, TestingModule } from '@nestjs/testing';
import { AgentArchetypeController } from './agent-archetype.controller';
import { AgentArchetypeService } from './agent-archetype.service';
import {
  CreateAgentArchetypeDto,
  UpdateAgentArchetypeDto,
  AgentArchetypeResponse,
} from '../common/dto/agent-archetype.dto';
import { AgentType } from '@openai/shared-types';

describe('AgentArchetypeController', () => {
  let controller: AgentArchetypeController;
  let service: jest.Mocked<AgentArchetypeService>;

  const mockService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgentArchetypeController],
      providers: [
        {
          provide: AgentArchetypeService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AgentArchetypeController>(AgentArchetypeController);
    service = module.get(AgentArchetypeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllArchetypes', () => {
    it('should return all archetypes', async () => {
      const mockArchetypes = [
        {
          id: 1,
          name: 'Test Archetype',
          description: 'Test',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      service.findAll.mockResolvedValue(
        mockArchetypes as AgentArchetypeResponse[]
      );

      const result = await controller.getAllArchetypes();

      expect(result).toEqual(mockArchetypes);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('getArchetype', () => {
    it('should return a single archetype', async () => {
      const mockArchetype = {
        id: 1,
        name: 'Test Archetype',
        description: 'Test',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      service.findById.mockResolvedValue(
        mockArchetype as AgentArchetypeResponse
      );

      const result = await controller.getArchetype(1);

      expect(result).toEqual(mockArchetype);
      expect(service.findById).toHaveBeenCalledWith(1);
    });
  });

  describe('createArchetype', () => {
    it('should create a new archetype', async () => {
      const createDto: CreateAgentArchetypeDto = {
        name: 'New Archetype',
        description: 'Description',
        agentType: AgentType.GENERAL,
      };

      const mockCreated = {
        id: 1,
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      service.create.mockResolvedValue(mockCreated as AgentArchetypeResponse);

      const result = await controller.createArchetype(createDto);

      expect(result).toEqual(mockCreated);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('updateArchetype', () => {
    it('should update an archetype', async () => {
      const updateDto: UpdateAgentArchetypeDto = {
        name: 'Updated Archetype',
        description: 'Updated',
      };

      const mockUpdated = {
        id: 1,
        ...updateDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      service.update.mockResolvedValue(mockUpdated as AgentArchetypeResponse);

      const result = await controller.updateArchetype(1, updateDto);

      expect(result).toEqual(mockUpdated);
      expect(service.update).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('deleteArchetype', () => {
    it('should delete an archetype', async () => {
      service.delete.mockResolvedValue(undefined);

      await controller.deleteArchetype(1);

      expect(service.delete).toHaveBeenCalledWith(1);
    });
  });
});
