import { useState } from 'react';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useAiRequestLogs } from '../hooks/queries/use-ai-request-logs';
import AiRequestLogTable from '../components/AiRequestLogTable';
import { AiRequestLogOrderBy, OrderDirection } from '../types/ai-request-log.enums';

export default function AiRequestLogsPage() {
  const { t } = useTranslation(I18nNamespace.ADMIN);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [orderBy, setOrderBy] = useState<AiRequestLogOrderBy>(AiRequestLogOrderBy.CREATED_AT);
  const [orderDirection, setOrderDirection] = useState<OrderDirection>(OrderDirection.DESC);

  const { data, isLoading, error } = useAiRequestLogs({
    page,
    pageSize,
    orderBy,
    orderDirection,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-text-secondary">{t('aiRequestLogs.loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
        {t('aiRequestLogs.error')}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-secondary mb-2">
          {t('aiRequestLogs.title')}
        </h2>
        <p className="text-text-tertiary text-sm">
          {data?.pagination.total
            ? t('aiRequestLogs.total', { count: data.pagination.total })
            : t('aiRequestLogs.noLogs')}
        </p>
      </div>
      <AiRequestLogTable
        logs={data?.logs || []}
        pagination={
          data?.pagination || {
            page: 1,
            pageSize: 50,
            total: 0,
            totalPages: 0,
          }
        }
        onPageChange={setPage}
        onOrderByChange={setOrderBy}
        onOrderDirectionChange={setOrderDirection}
        currentOrderBy={orderBy}
        currentOrderDirection={orderDirection}
      />
    </div>
  );
}
