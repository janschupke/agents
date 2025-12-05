import { useTranslation, I18nNamespace } from '@openai/i18n';
import type { AiRequestLog } from '../types/ai-request-log.types';
import {
  AiRequestLogOrderBy,
  OrderDirection,
} from '../types/ai-request-log.enums';
import { Table } from '@openai/ui';
import { useAiRequestLogColumns } from '../hooks/use-ai-request-log-columns';
import { formatJson } from '../utils/format-ai-request-log';

interface AiRequestLogTableProps {
  logs: AiRequestLog[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onOrderByChange: (orderBy: AiRequestLogOrderBy) => void;
  onOrderDirectionChange: (direction: OrderDirection) => void;
  currentOrderBy: AiRequestLogOrderBy;
  currentOrderDirection: OrderDirection;
}

export default function AiRequestLogTable({
  logs,
  pagination,
  onPageChange,
  onOrderByChange,
  onOrderDirectionChange,
  currentOrderBy,
  currentOrderDirection,
}: AiRequestLogTableProps) {
  const { t } = useTranslation(I18nNamespace.ADMIN);

  const columns = useAiRequestLogColumns({
    currentOrderBy,
    currentOrderDirection,
    onOrderByChange,
    onOrderDirectionChange,
  });

  return (
    <Table
      data={logs}
      columns={columns}
      pagination={{
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: pagination.total,
        onPageChange,
      }}
      expandable={{
        getRowId: (log: AiRequestLog) => String(log.id),
        renderExpanded: (log: AiRequestLog) => (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-text-secondary mb-2">
                {t('aiRequestLogs.request')}
              </h4>
              <pre className="bg-background-tertiary p-3 rounded text-xs overflow-auto max-h-96">
                {formatJson(log.requestJson)}
              </pre>
            </div>
            <div>
              <h4 className="font-medium text-text-secondary mb-2">
                {t('aiRequestLogs.response')}
              </h4>
              <pre className="bg-background-tertiary p-3 rounded text-xs overflow-auto max-h-96">
                {formatJson(log.responseJson)}
              </pre>
            </div>
          </div>
        ),
      }}
      emptyMessage={t('aiRequestLogs.noLogs')}
    />
  );
}
