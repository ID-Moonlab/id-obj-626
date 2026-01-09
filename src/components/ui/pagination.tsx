"use client";

import { Button } from "@heroui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  total: number;
  onPageSizeChange?: (size: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  total,
  onPageSizeChange,
}: PaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // 如果总页数少于等于最大可见页数，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 总是显示第一页
      pages.push(1);

      if (currentPage <= 3) {
        // 当前页在前3页
        for (let i = 2; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // 当前页在后3页
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // 当前页在中间
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-white rounded-b-xl">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <span>
          显示 {startItem}-{endItem} 条，共 {total} 条
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="light"
          size="sm"
          onPress={() => onPageChange(currentPage - 1)}
          isDisabled={currentPage === 1}
          className="rounded-xl"
          startContent={<ChevronLeft className="h-4 w-4" />}
        >
          上一页
        </Button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => {
            if (page === "...") {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-slate-400">
                  ...
                </span>
              );
            }

            const pageNum = page as number;
            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "solid" : "light"}
                size="sm"
                onPress={() => onPageChange(pageNum)}
                className={`rounded-xl min-w-[2.5rem] ${
                  currentPage === pageNum
                    ? "bg-blue-700 text-white"
                    : "hover:bg-slate-100"
                }`}
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        <Button
          variant="light"
          size="sm"
          onPress={() => onPageChange(currentPage + 1)}
          isDisabled={currentPage === totalPages}
          className="rounded-xl"
          endContent={<ChevronRight className="h-4 w-4" />}
        >
          下一页
        </Button>
      </div>
    </div>
  );
}

