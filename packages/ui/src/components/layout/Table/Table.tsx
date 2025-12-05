import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';

export interface TableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  sorting?: {
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
    onSortChange?: (column: string, direction: 'asc' | 'desc') => void;
  };
  expandable?: {
    renderExpanded: (row: T) => React.ReactNode;
    getRowId?: (row: T) => string;
  };
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

function Table<T>({
  data,
  columns,
  pagination,
  sorting,
  expandable,
  loading = false,
  emptyMessage = 'No data available',
  className = '',
}: TableProps<T>) {
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(
    new Set()
  );
  const [sortingState, setSortingState] = React.useState<SortingState>([]);

  const getRowId = expandable?.getRowId;

  const toggleRow = React.useCallback((rowId: string) => {
    setExpandedRows((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(rowId)) {
        newExpanded.delete(rowId);
      } else {
        newExpanded.add(rowId);
      }
      return newExpanded;
    });
  }, []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: getRowId,
    state: {
      sorting: sortingState,
    },
    onSortingChange: setSortingState,
    manualSorting: !!sorting,
    meta: {
      expandedRows,
      toggleExpand: toggleRow,
    },
  });

  if (loading) {
    return (
      <div className="bg-background-secondary rounded-lg border border-border p-8 text-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <div
      className={`bg-background-secondary rounded-lg border border-border overflow-hidden ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-background-tertiary">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase"
                    style={{
                      width:
                        header.getSize() !== 150 ? header.getSize() : undefined,
                    }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort()
                            ? 'cursor-pointer hover:bg-background-secondary select-none'
                            : ''
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: ' ↑',
                          desc: ' ↓',
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-text-tertiary"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => {
                const rowId = getRowId
                  ? getRowId(row.original)
                  : String(row.id);
                const isExpanded = expandedRows.has(rowId);
                return (
                  <React.Fragment key={row.id}>
                    <tr className="hover:bg-background-tertiary">
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-4 py-3 text-sm text-text-primary"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                    {expandable && isExpanded && (
                      <tr>
                        <td
                          colSpan={columns.length}
                          className="px-4 py-4 bg-background border-t border-border"
                        >
                          {expandable.renderExpanded(row.original)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination &&
        (() => {
          const totalPages = Math.ceil(pagination.total / pagination.pageSize);
          return (
            totalPages > 1 && (
              <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                <div className="text-sm text-text-tertiary">
                  Showing{' '}
                  {pagination.page * pagination.pageSize -
                    pagination.pageSize +
                    1}{' '}
                  to{' '}
                  {Math.min(
                    pagination.page * pagination.pageSize,
                    pagination.total
                  )}{' '}
                  of {pagination.total}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => pagination.onPageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 text-sm border border-border rounded hover:bg-background-tertiary disabled:opacity-50 disabled:cursor-not-allowed text-text-primary"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-text-secondary">
                    Page {pagination.page} of {totalPages}
                  </span>
                  <button
                    onClick={() => pagination.onPageChange(pagination.page + 1)}
                    disabled={pagination.page >= totalPages}
                    className="px-3 py-1 text-sm border border-border rounded hover:bg-background-tertiary disabled:opacity-50 disabled:cursor-not-allowed text-text-primary"
                  >
                    Next
                  </button>
                </div>
              </div>
            )
          );
        })()}
    </div>
  );
}

export default Table;
