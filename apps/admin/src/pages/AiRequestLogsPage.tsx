import { useState } from 'react';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useAiRequestLogs } from '../hooks/queries/use-ai-request-logs';
import AiRequestLogTable from '../components/AiRequestLogTable';
import {
  AiRequestLogOrderBy,
  OrderDirection,
} from '../types/ai-request-log.enums';
import { LoadingState, AdminPageHeader } from '../components/shared';

export default function AiRequestLogsPage() {
  const { t } = useTranslation(I18nNamespace.ADMIN);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [orderBy, setOrderBy] = useState<AiRequestLogOrderBy>(
    AiRequestLogOrderBy.CREATED_AT
  );
  const [orderDirection, setOrderDirection] = useState<OrderDirection>(
    OrderDirection.DESC
  );

  const { data, isLoading, error } = useAiRequestLogs({
    page,
    pageSize,
    orderBy,
    orderDirection,
  });

  if (isLoading) {
    return <LoadingState message={t('aiRequestLogs.loading')} />;
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
      <AdminPageHeader
        title={t('aiRequestLogs.title')}
        description={
          data?.pagination.total
            ? t('aiRequestLogs.total', { count: data.pagination.total })
            : t('aiRequestLogs.noLogs')
        }
      />
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
