import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  PageHeader,
  PageContent,
  Input,
  Button,
  Card,
} from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useSavedWords } from '../../hooks/queries/use-saved-words';
import { useDeleteSavedWord } from '../../hooks/mutations/use-saved-word-mutations';
import { SavedWord } from '../../types/saved-word.types';
import SavedWordsTable from './components/SavedWordsTable/SavedWordsTable';
import EditSavedWordModal from './components/EditSavedWordModal/EditSavedWordModal';
import { ROUTES } from '../../constants/routes.constants';

export default function SavedWords() {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const navigate = useNavigate();
  const { data: savedWords = [], isLoading } = useSavedWords();
  const deleteMutation = useDeleteSavedWord();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [editingWord, setEditingWord] = useState<SavedWord | null>(null);
  const [sortField, setSortField] = useState<keyof SavedWord>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filter words based on search term
  const filteredWords = useMemo(() => {
    if (!searchTerm.trim()) {
      return savedWords;
    }

    const lowerSearch = searchTerm.toLowerCase();
    return savedWords.filter(
      (word) =>
        word.originalWord.toLowerCase().includes(lowerSearch) ||
        word.translation.toLowerCase().includes(lowerSearch) ||
        (word.pinyin && word.pinyin.toLowerCase().includes(lowerSearch))
    );
  }, [savedWords, searchTerm]);

  // Sort words
  const sortedWords = useMemo(() => {
    const sorted = [...filteredWords].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return sorted;
  }, [filteredWords, sortField, sortDirection]);

  // Paginate words
  const paginatedWords = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedWords.slice(startIndex, endIndex);
  }, [sortedWords, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedWords.length / pageSize);

  const handleSort = (field: keyof SavedWord) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleEdit = (word: SavedWord) => {
    setEditingWord(word);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(t('savedWords.confirmDelete'))) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete word:', error);
      }
    }
  };

  const handleNavigateToSession = (
    agentId: number | null,
    sessionId: number | null
  ) => {
    if (agentId && sessionId) {
      navigate(ROUTES.CHAT_AGENT(agentId));
    }
  };

  return (
    <Container>
      <PageHeader title={t('savedWords.title')} />
      <PageContent>
        <div className="space-y-4">
          {/* Search and Controls */}
          <Card variant="outlined" padding="md">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex-1 w-full sm:w-auto">
                <Input
                  type="text"
                  placeholder={t('savedWords.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset to first page on search
                  }}
                  className="w-full"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-text-secondary">
                  {t('savedWords.pageSize')}:
                </label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-border rounded bg-background text-text-primary text-sm"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
            <div className="mt-2 text-sm text-text-secondary">
              {t('savedWords.totalWords', { count: filteredWords.length })}
            </div>
          </Card>

          {/* Table */}
          {isLoading ? (
            <Card variant="outlined" padding="md">
              <div className="text-center py-8 text-text-secondary">
                {t('common.loading')}
              </div>
            </Card>
          ) : paginatedWords.length === 0 ? (
            <Card variant="outlined" padding="md">
              <div className="text-center py-8 text-text-secondary">
                {searchTerm
                  ? t('savedWords.noWordsFound')
                  : t('savedWords.noWords')}
              </div>
            </Card>
          ) : (
            <>
              <SavedWordsTable
                words={paginatedWords}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onNavigateToSession={handleNavigateToSession}
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <Card variant="outlined" padding="md">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-text-secondary">
                      {t('savedWords.pageInfo', {
                        current: currentPage,
                        total: totalPages,
                        start: (currentPage - 1) * pageSize + 1,
                        end: Math.min(
                          currentPage * pageSize,
                          sortedWords.length
                        ),
                      })}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                      >
                        {t('common.previous')}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                      >
                        {t('common.next')}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </PageContent>

      {/* Edit Modal */}
      {editingWord && (
        <EditSavedWordModal
          isOpen={!!editingWord}
          onClose={() => setEditingWord(null)}
          word={editingWord}
        />
      )}
    </Container>
  );
}
