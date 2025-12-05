import { useState } from 'react';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useNavigate } from 'react-router-dom';
import type { AiRequestLog } from '../types/ai-request-log.types';
import {
  AiRequestLogOrderBy,
  OrderDirection,
} from '../types/ai-request-log.enums';
import { ROUTES } from '../constants/routes.constants';

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
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

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

  const formatJson = (json: Record<string, unknown>) => {
    return JSON.stringify(json, null, 2);
  };

  const getSortIcon = (column: AiRequestLogOrderBy) => {
    if (currentOrderBy !== column) return null;
    return currentOrderDirection === OrderDirection.ASC ? '↑' : '↓';
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

  return (
    <div className="bg-background-secondary rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-background-tertiary">
            <tr>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase cursor-pointer hover:bg-background-secondary"
                onClick={() => handleSort(AiRequestLogOrderBy.CREATED_AT)}
              >
                {t('aiRequestLogs.table.datetime')}{' '}
                {getSortIcon(AiRequestLogOrderBy.CREATED_AT)}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                {t('aiRequestLogs.table.user')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                {t('aiRequestLogs.table.agent')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                {t('aiRequestLogs.table.logType')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                {t('aiRequestLogs.table.model')}
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase cursor-pointer hover:bg-background-secondary"
                onClick={() => handleSort(AiRequestLogOrderBy.TOTAL_TOKENS)}
              >
                {t('aiRequestLogs.table.tokens')}{' '}
                {getSortIcon(AiRequestLogOrderBy.TOTAL_TOKENS)}
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase cursor-pointer hover:bg-background-secondary"
                onClick={() => handleSort(AiRequestLogOrderBy.ESTIMATED_PRICE)}
              >
                {t('aiRequestLogs.table.price')}{' '}
                {getSortIcon(AiRequestLogOrderBy.ESTIMATED_PRICE)}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                {t('aiRequestLogs.table.response')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                {t('aiRequestLogs.table.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-8 text-center text-text-tertiary"
                >
                  {t('aiRequestLogs.noLogs')}
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const isExpanded = expandedRows.has(log.id);
                const responseContent =
                  (
                    log.responseJson as {
                      choices?: Array<{ message?: { content?: string } }>;
                    }
                  )?.choices?.[0]?.message?.content || '';

                return (
                  <tr key={log.id} className="hover:bg-background-tertiary">
                    <td className="px-4 py-3 text-sm text-text-primary">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-primary">
                      {log.user
                        ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() ||
                          log.user.email ||
                          log.userId
                        : log.userId || t('aiRequestLogs.deletedUser')}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-primary">
                      {log.agent ? (
                        <button
                          onClick={() => navigate(ROUTES.AGENT_DETAIL(log.agent!.id))}
                          className="text-primary hover:text-primary-hover hover:underline"
                        >
                          {log.agent.name}
                        </button>
                      ) : (
                        <span className="text-text-tertiary">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-primary">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-background-tertiary text-text-secondary">
                        {t(`aiRequestLogs.logTypes.${log.logType.toLowerCase()}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-primary">
                      {log.model}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-primary">
                      {log.totalTokens.toLocaleString()}
                      <span className="text-text-tertiary text-xs ml-1">
                        ({log.promptTokens}/{log.completionTokens})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-primary font-mono">
                      {formatPrice(log.estimatedPrice)}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-primary">
                      {truncateText(responseContent, 100)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => toggleRow(log.id)}
                        className="text-primary hover:text-primary-hover"
                      >
                        {isExpanded
                          ? t('aiRequestLogs.collapse')
                          : t('aiRequestLogs.expand')}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Expanded row details */}
      {logs.map((log) => {
        if (!expandedRows.has(log.id)) return null;

        return (
          <div
            key={`expanded-${log.id}`}
            className="border-t border-border bg-background p-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-text-secondary mb-2">
                  {t('aiRequestLogs.request')}
                </h4>
                <pre className="bg-background-tertiary p-3 rounded text-xs overflow-auto max-h-64">
                  {formatJson(log.requestJson)}
                </pre>
              </div>
              <div>
                <h4 className="font-medium text-text-secondary mb-2">
                  {t('aiRequestLogs.response')}
                </h4>
                <pre className="bg-background-tertiary p-3 rounded text-xs overflow-auto max-h-64">
                  {formatJson(log.responseJson)}
                </pre>
              </div>
            </div>
          </div>
        );
      })}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="px-4 py-3 border-t border-border flex items-center justify-between">
          <div className="text-sm text-text-tertiary">
            {t('aiRequestLogs.pagination.showing', {
              start: (pagination.page - 1) * pagination.pageSize + 1,
              end: Math.min(
                pagination.page * pagination.pageSize,
                pagination.total
              ),
              total: pagination.total,
            })}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 text-sm border border-border rounded hover:bg-background-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('aiRequestLogs.pagination.previous')}
            </button>
            <span className="px-3 py-1 text-sm text-text-secondary">
              {t('aiRequestLogs.pagination.page', {
                current: pagination.page,
                total: pagination.totalPages,
              })}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 text-sm border border-border rounded hover:bg-background-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('aiRequestLogs.pagination.next')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
