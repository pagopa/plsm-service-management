import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

export function Pagination<TData>({
  table,
  itemsLength,
}: {
  table: Table<TData>;
  itemsLength: number;
}) {
  const pageSize = table.getState().pagination.pageSize;
  const currentPage = table.getState().pagination.pageIndex;
  const startIndex = itemsLength < 1 ? 0 : currentPage * pageSize + 1;
  const endIndex = (currentPage + 1) * pageSize;

  return (
    <div className="grid grid-cols-3 w-full space-x-2">
      <Select
        onValueChange={(value) => table.setPageSize(Number(value))}
        defaultValue="10"
      >
        <SelectTrigger className="w-[180px]" size="sm">
          <SelectValue placeholder="Elementi per pagina" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="10">10 per pagina</SelectItem>
          <SelectItem value="20">20 per pagina</SelectItem>
          <SelectItem value="50">50 per pagina</SelectItem>
        </SelectContent>
      </Select>

      <div className="w-full inline-flex items-center justify-center">
        <p className="text-sm">
          {startIndex} - {itemsLength < endIndex ? itemsLength : endIndex}{" "}
          <span className="text-muted-foreground">di</span> {itemsLength}
        </p>
      </div>

      <div className="w-full inline-flex items-center justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeftIcon className="size-3.5 opacity-60" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRightIcon className="size-3.5 opacity-60" />
        </Button>
      </div>
    </div>
  );
}
