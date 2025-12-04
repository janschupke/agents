import { SavedWord } from '../../../../types/saved-word.types';
import { Button } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { IconEdit, IconTrash } from '@openai/ui';

interface SavedWordsTableProps {
  words: SavedWord[];
  sortField: keyof SavedWord;
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof SavedWord) => void;
  onEdit: (word: SavedWord) => void;
  onDelete: (id: number) => void;
  onNavigateToSession: (
    agentId: number | null,
    sessionId: number | null
  ) => void;
}

export default function SavedWordsTable({
  words,
  sortField,
  sortDirection,
  onSort,
  onEdit,
  onDelete,
  onNavigateToSession,
}: SavedWordsTableProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  const SortableHeader = ({
    field,
    children,
  }: {
    field: keyof SavedWord;
    children: React.ReactNode;
  }) => (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide cursor-pointer hover:bg-background-secondary"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortField === field && (
          <span className="text-text-tertiary">
            {sortDirection === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="bg-background-secondary">
          <tr>
            <SortableHeader field="originalWord">
              {t('savedWords.originalWord')}
            </SortableHeader>
            <SortableHeader field="pinyin">
              {t('savedWords.pinyin')}
            </SortableHeader>
            <SortableHeader field="translation">
              {t('savedWords.translation')}
            </SortableHeader>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
              {t('savedWords.context')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
              {t('savedWords.agent')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
              {t('savedWords.session')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
              {t('common.actions')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {words.map((word) => (
            <tr
              key={word.id}
              className="hover:bg-background-secondary transition-colors"
            >
              <td className="px-4 py-3 text-sm text-text-primary font-medium">
                {word.originalWord}
              </td>
              <td className="px-4 py-3 text-sm text-text-secondary">
                {word.pinyin || '-'}
              </td>
              <td className="px-4 py-3 text-sm text-text-primary">
                {word.translation}
              </td>
              <td className="px-4 py-3 text-sm text-text-secondary max-w-xs truncate">
                {word.sentences && word.sentences.length > 0
                  ? word.sentences[0].sentence
                  : '-'}
                {word.sentences && word.sentences.length > 1 && (
                  <span className="ml-1 text-text-tertiary">
                    (+{word.sentences.length - 1})
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-sm">
                {word.agentName ? (
                  <span className="text-text-primary">{word.agentName}</span>
                ) : (
                  <span className="text-text-tertiary">-</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm">
                {word.sessionName ? (
                  <button
                    onClick={() =>
                      onNavigateToSession(word.agentId, word.sessionId)
                    }
                    className="text-primary hover:underline"
                    disabled={!word.agentId || !word.sessionId}
                  >
                    {word.sessionName}
                  </button>
                ) : (
                  <span className="text-text-tertiary">-</span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => onEdit(word)}
                    tooltip={t('common.edit')}
                  >
                    <IconEdit size="xs" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => onDelete(word.id)}
                    tooltip={t('common.delete')}
                  >
                    <IconTrash size="xs" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
