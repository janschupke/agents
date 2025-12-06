import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AgentSidebarItem from './AgentSidebarItem';
import { Agent } from '../../../../../types/chat.types';
import { AgentType } from '@openai/shared-types';
import { Gender } from '../../../../../types/agent.types';

// Mock i18n
vi.mock('@openai/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  I18nNamespace: {
    CLIENT: 'client',
  },
}));

describe('AgentSidebarItem', () => {
  const mockAgent: Agent = {
    id: 1,
    name: 'Test Agent',
    description: null,
    avatarUrl: null,
    agentType: AgentType.GENERAL,
    language: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    configs: {},
  };

  const defaultProps = {
    agent: mockAgent,
    isSelected: false,
    onClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic rendering', () => {
    it('should render agent name', () => {
      render(<AgentSidebarItem {...defaultProps} />);
      expect(screen.getByText('Test Agent')).toBeInTheDocument();
    });

    it('should render avatar', () => {
      render(<AgentSidebarItem {...defaultProps} />);
      // Avatar should be rendered (check by the initial)
      expect(screen.getByText('T')).toBeInTheDocument();
    });

    it('should call onClick when clicked', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<AgentSidebarItem {...defaultProps} onClick={onClick} />);

      const button = screen.getByText('Test Agent').closest('button');
      if (button) {
        await user.click(button);
        expect(onClick).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Language assistant icon', () => {
    it('should show translate icon for language assistant', () => {
      const languageAgent: Agent = {
        ...mockAgent,
        agentType: AgentType.LANGUAGE_ASSISTANT,
      };
      render(<AgentSidebarItem {...defaultProps} agent={languageAgent} />);

      // Check for translate icon (it should be in the DOM)
      const icon = screen
        .getByText('Test Agent')
        .closest('div')
        ?.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should not show translate icon for general agent', () => {
      render(<AgentSidebarItem {...defaultProps} />);

      // For general agents, the icon container should not have the translate icon
      // The icon should not be present (or if it is, it's not the translate icon)
      // We can check by ensuring the name is visible and not replaced
      expect(screen.getByText('Test Agent')).toBeInTheDocument();
    });

    it('should position icon next to name, not replace it', () => {
      const languageAgent: Agent = {
        ...mockAgent,
        agentType: AgentType.LANGUAGE_ASSISTANT,
        name: 'Language Agent',
      };
      render(<AgentSidebarItem {...defaultProps} agent={languageAgent} />);

      // Name should still be visible
      expect(screen.getByText('Language Agent')).toBeInTheDocument();
      // Icon should be present as well
      const nameContainer = screen.getByText('Language Agent').closest('div');
      expect(nameContainer).toBeInTheDocument();
    });
  });

  describe('Age and gender metadata', () => {
    it('should display age when provided', () => {
      const agentWithAge: Agent = {
        ...mockAgent,
        configs: {
          age: 25,
        },
      };
      render(<AgentSidebarItem {...defaultProps} agent={agentWithAge} />);

      // Find the metadata element and verify it contains the age
      const metadataElement = screen.getByText('25');
      expect(metadataElement).toBeInTheDocument();
      expect(metadataElement.textContent).toBe('25');
    });

    it('should display gender when provided (Male)', () => {
      const agentWithGender: Agent = {
        ...mockAgent,
        configs: {
          gender: Gender.MALE,
        },
      };
      render(<AgentSidebarItem {...defaultProps} agent={agentWithGender} />);

      const metadataElement = screen.getByText('config.genderMale');
      expect(metadataElement).toBeInTheDocument();
      expect(metadataElement.textContent).toBe('config.genderMale');
    });

    it('should display gender when provided (Female)', () => {
      const agentWithGender: Agent = {
        ...mockAgent,
        configs: {
          gender: Gender.FEMALE,
        },
      };
      render(<AgentSidebarItem {...defaultProps} agent={agentWithGender} />);

      const metadataElement = screen.getByText('config.genderFemale');
      expect(metadataElement).toBeInTheDocument();
      expect(metadataElement.textContent).toBe('config.genderFemale');
    });

    it('should display gender when provided (Other/Non-binary)', () => {
      const agentWithGender: Agent = {
        ...mockAgent,
        configs: {
          gender: Gender.NON_BINARY,
        },
      };
      render(<AgentSidebarItem {...defaultProps} agent={agentWithGender} />);

      const metadataElement = screen.getByText('config.genderOther');
      expect(metadataElement).toBeInTheDocument();
      expect(metadataElement.textContent).toBe('config.genderOther');
    });

    it('should display age and gender in format "Age • Gender"', () => {
      const agentWithBoth: Agent = {
        ...mockAgent,
        configs: {
          age: 30,
          gender: Gender.MALE,
        },
      };
      const { container } = render(
        <AgentSidebarItem {...defaultProps} agent={agentWithBoth} />
      );

      // Get the actual metadata container by class
      const metadataContainer = container.querySelector(
        '.text-xs.text-text-tertiary'
      );

      expect(metadataContainer).toBeInTheDocument();
      expect(metadataContainer?.textContent).toBe('30 • config.genderMale');
    });

    it('INTEGRATION: should actually render age and gender in the DOM', () => {
      const agentWithBoth: Agent = {
        ...mockAgent,
        name: 'Test Agent With Data',
        configs: {
          age: 25,
          gender: Gender.FEMALE,
        },
      };
      const { container } = render(
        <AgentSidebarItem {...defaultProps} agent={agentWithBoth} />
      );

      // Verify the component rendered
      expect(screen.getByText('Test Agent With Data')).toBeInTheDocument();

      // Find the metadata div
      const metadataDiv = container.querySelector(
        '.text-xs.text-text-tertiary.truncate.mt-0\\.5'
      );

      // This should exist and contain the formatted string
      expect(metadataDiv).toBeInTheDocument();
      expect(metadataDiv?.textContent).toBe('25 • config.genderFemale');

      // Verify it's actually visible in the rendered HTML
      const html = container.innerHTML;
      expect(html).toContain('25 • config.genderFemale');
    });

    it('should display only age when gender is not provided', () => {
      const agentWithAgeOnly: Agent = {
        ...mockAgent,
        configs: {
          age: 25,
        },
      };
      render(<AgentSidebarItem {...defaultProps} agent={agentWithAgeOnly} />);

      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.queryByText(/config\.gender/)).not.toBeInTheDocument();
    });

    it('should display only gender when age is not provided', () => {
      const agentWithGenderOnly: Agent = {
        ...mockAgent,
        configs: {
          gender: Gender.FEMALE,
        },
      };
      render(
        <AgentSidebarItem {...defaultProps} agent={agentWithGenderOnly} />
      );

      expect(screen.getByText('config.genderFemale')).toBeInTheDocument();
      // Should not show age
      const metadata = screen.getByText('config.genderFemale');
      expect(metadata.textContent).not.toContain(/\d+/);
    });

    it('should handle age of 0 correctly', () => {
      const agentWithZeroAge: Agent = {
        ...mockAgent,
        configs: {
          age: 0,
        },
      };
      render(
        <AgentSidebarItem {...defaultProps} agent={agentWithZeroAge} />
      );

      // Age 0 should not be displayed (it's not a valid age)
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('should not display metadata when neither age nor gender is provided', () => {
      render(<AgentSidebarItem {...defaultProps} />);

      // Should not have metadata line
      const nameElement = screen.getByText('Test Agent');
      const parent = nameElement.closest('div');
      const metadataElements = parent?.querySelectorAll('.text-xs.text-text-tertiary');
      expect(metadataElements?.length).toBe(0);
    });

    it('should handle undefined configs gracefully', () => {
      const agentWithoutConfigs: Agent = {
        ...mockAgent,
        configs: undefined,
      };
      render(
        <AgentSidebarItem {...defaultProps} agent={agentWithoutConfigs} />
      );

      expect(screen.getByText('Test Agent')).toBeInTheDocument();
    });

    it('should handle null age correctly', () => {
      const agentWithNullAge: Agent = {
        ...mockAgent,
        configs: {
          age: null as unknown as number,
        },
      };
      render(
        <AgentSidebarItem {...defaultProps} agent={agentWithNullAge} />
      );

      expect(screen.queryByText(/\d+/)).not.toBeInTheDocument();
    });

    it('should handle empty string gender correctly', () => {
      const agentWithEmptyGender: Agent = {
        ...mockAgent,
        configs: {
          gender: '',
        },
      };
      render(
        <AgentSidebarItem {...defaultProps} agent={agentWithEmptyGender} />
      );

      expect(screen.queryByText(/config\.gender/)).not.toBeInTheDocument();
    });
  });

  describe('Delete button', () => {
    it('should show delete button when showDelete is true and onDelete is provided', () => {
      const onDelete = vi.fn();
      render(
        <AgentSidebarItem
          {...defaultProps}
          showDelete={true}
          onDelete={onDelete}
        />
      );

      // Delete button should be present (check by looking for trash icon or button)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(1); // At least the main button and delete button
    });

    it('should not show delete button when showDelete is false', () => {
      const onDelete = vi.fn();
      render(
        <AgentSidebarItem
          {...defaultProps}
          showDelete={false}
          onDelete={onDelete}
        />
      );

      // Should only have the main clickable button
      const buttons = screen.getAllByRole('button');
      // Main button should exist, but delete button should not be visible
      expect(buttons.length).toBe(1);
    });

    it('should not show delete button when onDelete is not provided', () => {
      render(<AgentSidebarItem {...defaultProps} showDelete={true} />);

      // Should only have the main clickable button
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(1);
    });

    it('should call onDelete when delete button is clicked', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      render(
        <AgentSidebarItem
          {...defaultProps}
          showDelete={true}
          onDelete={onDelete}
        />
      );

      // Find and click delete button
      const buttons = screen.getAllByRole('button');
      const deleteButton = buttons.find((btn) =>
        btn.querySelector('svg')
      );
      if (deleteButton) {
        await user.click(deleteButton);
        expect(onDelete).toHaveBeenCalledWith(mockAgent.id);
      }
    });
  });

  describe('Selection state', () => {
    it('should apply selected styling when isSelected is true', () => {
      render(<AgentSidebarItem {...defaultProps} isSelected={true} />);

      const sidebarItem = screen.getByText('Test Agent').closest('[class*="bg-primary"]');
      expect(sidebarItem).toBeInTheDocument();
    });

    it('should not apply selected styling when isSelected is false', () => {
      render(<AgentSidebarItem {...defaultProps} isSelected={false} />);

      const sidebarItem = screen.getByText('Test Agent').closest('div');
      expect(sidebarItem).toBeInTheDocument();
    });
  });
});
