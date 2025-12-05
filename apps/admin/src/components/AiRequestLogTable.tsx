import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useNavigate } from 'react-router-dom';
import type { AiRequestLog } from '../types/ai-request-log.types';
import {
  AiRequestLogOrderBy,
  OrderDirection,
} from '../types/ai-request-log.enums';
import { ROUTES } from '../constants/routes.constants';
import { Table, Button } from '@openai/ui';
import { ColumnDef } from '@tanstack/react-table';
import {
  formatDate,
  formatPrice,
  formatRequest,
  formatResponse,
  formatJson,
} from '../utils/format-ai-request-log';

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
  const navigate = useNavigate();

  const getSortIcon = (column: AiRequestLogOrderBy) => {
    if (currentOrderBy !== column) return null;
    return currentOrderDirection === OrderDirection.ASC ? ' ↑' : ' ↓';
  };

  const handleSort = (column: AiRequestLogOrderBy) => {
    if (currentOrderBy === column) {
      onOrderDirectionChange(
        currentOrderDirection === OrderDirection.ASC
          ? OrderDirection.DESC
          : OrderDirection.ASC
      );
    } else {
      onOrderByChange(column);
      onOrderDirectionChange(OrderDirection.DESC);
    }
  };

  const columns: ColumnDef<AiRequestLog>[] = [
    {
      accessorKey: 'createdAt',
      header: () => (
        <button
          type="button"
          onClick={() => handleSort(AiRequestLogOrderBy.CREATED_AT)}
          className="flex items-center gap-1"
        >
          {t('aiRequestLogs.table.datetime')}
          {getSortIcon(AiRequestLogOrderBy.CREATED_AT)}
        </button>
      ),
      cell: ({ row }: { row: { original: AiRequestLog } }) => (
        <div className="text-sm text-text-primary">
          {formatDate(row.original.createdAt)}
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'user',
      header: t('aiRequestLogs.table.user'),
      cell: ({ row }: { row: { original: AiRequestLog } }) => {
        const log = row.original;
        return (
          <div className="text-sm text-text-primary">
            {log.user
              ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() ||
                log.user.email ||
                log.userId
              : log.userId || t('aiRequestLogs.deletedUser')}
          </div>
        );
      },
    },
    {
      accessorKey: 'agent',
      header: t('aiRequestLogs.table.agent'),
      cell: ({ row }: { row: { original: AiRequestLog } }) => {
        const log = row.original;
        return log.agent ? (
          <button
            onClick={() => navigate(ROUTES.AGENT_DETAIL(log.agent!.id))}
            className="text-primary hover:text-primary-hover hover:underline text-sm"
          >
            {log.agent.name}
          </button>
        ) : (
          <span className="text-text-tertiary text-sm">-</span>
        );
      },
    },
    {
      accessorKey: 'logType',
      header: t('aiRequestLogs.table.logType'),
      cell: ({ row }: { row: { original: AiRequestLog } }) => (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-background-tertiary text-text-secondary">
          {t(`aiRequestLogs.logTypes.${row.original.logType.toLowerCase()}`)}
        </span>
      ),
    },
    {
      accessorKey: 'model',
      header: t('aiRequestLogs.table.model'),
      cell: ({ row }: { row: { original: AiRequestLog } }) => (
        <div className="text-sm text-text-primary">{row.original.model}</div>
      ),
    },
    {
      accessorKey: 'totalTokens',
      header: () => (
        <button
          type="button"
          onClick={() => handleSort(AiRequestLogOrderBy.TOTAL_TOKENS)}
          className="flex items-center gap-1"
        >
          {t('aiRequestLogs.table.tokens')}
          {getSortIcon(AiRequestLogOrderBy.TOTAL_TOKENS)}
        </button>
      ),
      cell: ({ row }: { row: { original: AiRequestLog } }) => {
        const log = row.original;
        return (
          <div className="text-sm text-text-primary">
            {log.totalTokens.toLocaleString()}
            <span className="text-text-tertiary text-xs ml-1">
              ({log.promptTokens}/{log.completionTokens})
            </span>
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: 'estimatedPrice',
      header: () => (
        <button
          type="button"
          onClick={() => handleSort(AiRequestLogOrderBy.ESTIMATED_PRICE)}
          className="flex items-center gap-1"
        >
          {t('aiRequestLogs.table.price')}
          {getSortIcon(AiRequestLogOrderBy.ESTIMATED_PRICE)}
        </button>
      ),
      cell: ({ row }: { row: { original: AiRequestLog } }) => (
        <div className="text-sm text-text-primary font-mono">
          {formatPrice(row.original.estimatedPrice)}
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'request',
      header: t('aiRequestLogs.table.request'),
      cell: ({ row }: { row: { original: AiRequestLog } }) => (
        <div className="text-sm text-text-primary">
          {formatRequest(row.original.requestJson)}
        </div>
      ),
    },
    {
      accessorKey: 'response',
      header: t('aiRequestLogs.table.response'),
      cell: ({ row }: { row: { original: AiRequestLog } }) => (
        <div className="text-sm text-text-primary">
          {formatResponse(row.original.responseJson)}
        </div>
      ),
    },
    {
      id: 'actions',
      header: t('aiRequestLogs.table.actions'),
      cell: (info: {
        row: { original: AiRequestLog };
        table: {
          options: {
            meta?: {
              expandedRows?: Set<string | number>;
              toggleExpand?: (id: string | number) => void;
            };
          };
        };
      }) => {
        const log = info.row.original;
        const table = info.table;
        const rowId = String(log.id);
        const meta = table.options.meta as {
          expandedRows?: Set<string>;
          toggleExpand?: (id: string) => void;
        };
        const isExpanded = meta?.expandedRows?.has(rowId) || false;
        const toggleExpand = () => meta?.toggleExpand?.(rowId);
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpand}
            className="text-primary hover:text-primary-hover"
          >
            {isExpanded
              ? t('aiRequestLogs.collapse')
              : t('aiRequestLogs.expand')}
          </Button>
        );
      },
    },
  ];

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
