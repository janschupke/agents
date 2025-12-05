import React from 'react';
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatPrice = (price: number | string | null | undefined) => {
    if (price === null || price === undefined) {
      return '$0.000000';
    }
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) {
      return '$0.000000';
    }
    return `$${numPrice.toFixed(6)}`;
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatRequest = (requestJson: Record<string, unknown>): string => {
    const requestStr = JSON.stringify(requestJson, null, 2);
    return truncateText(requestStr, 100);
  };

  const formatResponse = (responseJson: Record<string, unknown>): string => {
    const responseContent =
      (
        responseJson as {
          choices?: Array<{ message?: { content?: string } }>;
        }
      )?.choices?.[0]?.message?.content || '';
    return truncateText(responseContent, 100);
  };

  const formatJson = (json: Record<string, unknown>) => {
    return JSON.stringify(json, null, 2);
  };

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
      cell: ({ row }) => (
        <div className="text-sm text-text-primary">
          {formatDate(row.original.createdAt)}
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'user',
      header: t('aiRequestLogs.table.user'),
      cell: ({ row }) => {
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
      cell: ({ row }) => {
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
      cell: ({ row }) => (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-background-tertiary text-text-secondary">
          {t(`aiRequestLogs.logTypes.${row.original.logType.toLowerCase()}`)}
        </span>
      ),
    },
    {
      accessorKey: 'model',
      header: t('aiRequestLogs.table.model'),
      cell: ({ row }) => (
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
      cell: ({ row }) => {
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
      cell: ({ row }) => (
        <div className="text-sm text-text-primary font-mono">
          {formatPrice(row.original.estimatedPrice)}
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'request',
      header: t('aiRequestLogs.table.request'),
      cell: ({ row }) => (
        <div className="text-sm text-text-primary">
          {formatRequest(row.original.requestJson)}
        </div>
      ),
    },
    {
      accessorKey: 'response',
      header: t('aiRequestLogs.table.response'),
      cell: ({ row }) => (
        <div className="text-sm text-text-primary">
          {formatResponse(row.original.responseJson)}
        </div>
      ),
    },
    {
      id: 'actions',
      header: t('aiRequestLogs.table.actions'),
      cell: (info) => {
        const log = info.row.original;
        const table = info.table;
        const rowId = log.id;
        const meta = table.options.meta as {
          expandedRows?: Set<string | number>;
          toggleExpand?: (id: string | number) => void;
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
        getRowId: (log) => log.id,
        renderExpanded: (log) => (
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
