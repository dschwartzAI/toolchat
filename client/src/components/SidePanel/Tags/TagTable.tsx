import React, { useCallback, useEffect, useState } from 'react';
import { TagIcon } from 'lucide-react';
import type { ConversationTagsResponse, TConversationTag } from 'librechat-data-provider';
import {
  Table,
  Input,
  Button,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableHeader,
  OGDialogTrigger,
} from '~/components/ui';
import { TagContext, useTagContext } from '~/Providers/TagContext';
import { TagEditDialog } from '~/components/Tags';
import TagTableRow from './TagTableRow';
import { useLocalize } from '~/hooks';

const removeDuplicates = (tags: TConversationTag[]) => {
  const seen = new Set();
  return tags.filter((tag) => {
    const duplicate = seen.has(tag._id);
    seen.add(tag._id);
    return !duplicate;
  });
};

const TagTable = () => {
  const localize = useLocalize();
  const [rows, setRows] = useState<ConversationTagsResponse>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);
  const pageSize = 10;

  const { tags: allTags = [] } = useTagContext();

  useEffect(() => {
    const _tags = removeDuplicates(allTags).sort((a, b) => a.position - b.position);
    setRows(_tags);
  }, [allTags]);

  const moveRow = useCallback((dragIndex: number, hoverIndex: number) => {
    setRows((prevTags: TConversationTag[]) => {
      const updatedRows = [...prevTags];
      const [movedRow] = updatedRows.splice(dragIndex, 1);
      updatedRows.splice(hoverIndex, 0, movedRow);
      return updatedRows.map((row, index) => ({ ...row, position: index }));
    });
  }, []);

  const renderRow = useCallback(
    (row: TConversationTag) => (
      <TagTableRow key={row._id} moveRow={moveRow} row={row} position={row.position} />
    ),
    [moveRow],
  );

  const filteredRows = rows.filter(
    (row) => row.tag && row.tag.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const currentRows = filteredRows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  return (
    <TagContext.Provider value={{ tags: allTags }}>
      <div role="region" aria-label={localize('com_ui_tags')} className="mt-2 space-y-2">
        <div className="flex items-center gap-4">
          <Input
            placeholder={localize('com_ui_tags_filter')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label={localize('com_ui_tags_filter')}
          />
        </div>

        <div className="rounded-lg border border-border-light bg-transparent shadow-sm transition-colors">
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow className="border-b border-border-light">
                <TableHead className="w-[70%] bg-surface-secondary py-3 text-left text-sm font-medium text-text-secondary">
                  <div>{localize('com_ui_tags_title')}</div>
                </TableHead>
                <TableHead className="w-[30%] bg-surface-secondary py-3 text-left text-sm font-medium text-text-secondary">
                  <div>{localize('com_ui_tags_count')}</div>
                </TableHead>
                <TableHead className="w-[40%] bg-surface-secondary py-3 text-left text-sm font-medium text-text-secondary">
                  <div>{localize('com_assistants_actions')}</div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRows.length ? (
                currentRows.map(renderRow)
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-sm text-text-secondary">
                    {localize('com_ui_no_tags')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex justify-between gap-2">
            <TagEditDialog context="TagPanel" open={open} setOpen={setOpen}>
              <OGDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 text-sm"
                  onClick={() => setOpen(!open)}
                >
                  <TagIcon className="size-4" />
                  <div className="break-all">{localize('com_ui_tags_new')}</div>
                </Button>
              </OGDialogTrigger>
            </TagEditDialog>
          </div>
          <div className="flex items-center gap-2" role="navigation" aria-label="Pagination">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
              disabled={pageIndex === 0}
              aria-label={localize('com_ui_prev')}
            >
              {localize('com_ui_prev')}
            </Button>
            <div aria-live="polite" className="text-sm">
              {`${pageIndex + 1} / ${Math.ceil(filteredRows.length / pageSize)}`}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPageIndex((prev) =>
                  (prev + 1) * pageSize < filteredRows.length ? prev + 1 : prev,
                )
              }
              disabled={(pageIndex + 1) * pageSize >= filteredRows.length}
              aria-label={localize('com_ui_next')}
            >
              {localize('com_ui_next')}
            </Button>
          </div>
        </div>
      </div>
    </TagContext.Provider>
  );
};

export default TagTable;
