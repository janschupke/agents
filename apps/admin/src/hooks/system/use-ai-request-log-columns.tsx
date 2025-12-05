import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@openai/ui';
import type { AiRequestLog } from '../../types/ai-request-log.types';
import {
  AiRequestLogOrderBy,
  OrderDirection,
} from '../../types/ai-request-log.enums';
import { ROUTES } from '../../constants/routes.constants';
import {
  formatDate,
  formatPrice,
  formatRequest,
  formatResponse,
} from '../../utils/format-ai-request-log';

interface UseAiRequestLogColumnsProps {
  currentOrderBy: AiRequestLogOrderBy;
  currentOrderDirection: OrderDirection;
  onOrderByChange: (orderBy: AiRequestLogOrderBy) => void;
  onOrderDirectionChange: (direction: OrderDirection) => void;
}

export function useAiRequestLogColumns({
  currentOrderBy,
  currentOrderDirection,
  onOrderByChange,
  onOrderDirectionChange,
}: UseAiRequestLogColumnsProps) {
  const { t } = useTranslation(I18nNamespace.ADMIN);
  const navigate = useNavigate();

  const getSortIcon = (column: AiRequestLogOrderBy) => {
    if (currentOrderBy !== column) return null;
    return currentOrderDirection === OrderDirection.ASC ? ' ↑' : ' ↓';
  };

  const handleSort = (column: AiRequestLogOrderBy) => {
    if (currentOrderBy === column) {
      // Toggle direction
      onOrderDirectionChange(
        currentOrderDirection === OrderDirection.ASC
          ? OrderDirection.DESC
          : OrderDirection.ASC
      );
    } else {
      // Set new column
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
          className="flex items-center gap-1 hover:text-text-primary transition-colors"
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
            type="button"
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
          className="flex items-center gap-1 hover:text-text-primary transition-colors"
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
          className="flex items-center gap-1 hover:text-text-primary transition-colors"
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

  return columns;
}
