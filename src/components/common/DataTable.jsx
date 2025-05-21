import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Search, Filter, Settings } from "lucide-react";
import { Input } from "../ui/input.tsx";
import { Button } from "../ui/button.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "../ui/dropdown-menu.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table.tsx";
import { Badge } from "../ui/badge.tsx";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination.tsx";
import { Checkbox } from "../ui/checkbox.tsx";

export default function DataTable({
  data = [],
  columns = [],
  filters = [],
  searchFields = [],
  onRowClick,
  rowClassName,
  defaultSort = null,
  defaultItemsPerPage = 10,
  itemsPerPageOptions = [5, 10, 25, 50, 100],
}) {
  // Basic state
  const [sortConfig, setSortConfig] = useState(
    defaultSort || { key: null, direction: "asc" }
  );
  const [searchText, setSearchText] = useState("");
  const [activeFilters, setActiveFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);
  const [visibleColumns, setVisibleColumns] = useState(
    columns.map((col) => col.accessor)
  );

  // Handle sorting
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Apply filters and search
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter((item) =>
        searchFields.some((field) => {
          const value = field
            .split(".")
            .reduce((obj, key) => obj && obj[key], item);
          return value && value.toString().toLowerCase().includes(searchLower);
        })
      );
    }

    // Apply filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        (Array.isArray(value) ? value.length > 0 : true)
      ) {
        result = result.filter((item) => {
          const itemValue = key
            .split(".")
            .reduce((obj, k) => obj && obj[k], item);
          return Array.isArray(value)
            ? value.includes(itemValue)
            : itemValue === value;
        });
      }
    });

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = sortConfig.key
          .split(".")
          .reduce((obj, key) => obj && obj[key], a);
        const bValue = sortConfig.key
          .split(".")
          .reduce((obj, key) => obj && obj[key], b);

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortConfig.direction === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [data, searchText, activeFilters, sortConfig, searchFields]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  // Handle filter change
  const handleFilterChange = (filterKey, value) => {
    setActiveFilters((prev) => ({
      ...prev,
      [filterKey]: value,
    }));
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Reset filters
  const resetFilters = () => {
    setActiveFilters({});
    setSearchText("");
    setCurrentPage(1);
  };

  // Toggle column visibility
  const toggleColumnVisibility = (accessor) => {
    setVisibleColumns((prev) => {
      if (prev.includes(accessor)) {
        return prev.filter((col) => col !== accessor);
      } else {
        return [...prev, accessor];
      }
    });
  };

  // Render cell content
  const renderCell = (item, column) => {
    if (column.render) {
      return column.render(item);
    }

    const value = column.accessor
      .split(".")
      .reduce((obj, key) => obj && obj[key], item);

    if (column.type === "status") {
      let variant = "default";
      switch (value?.toLowerCase?.()) {
        case "active":
        case "approved":
          variant = "success";
          break;
        case "pending":
          variant = "secondary";
          break;
        case "rejected":
        case "failed":
          variant = "destructive";
          break;
        default:
          variant = "default";
      }
      return <Badge variant={variant}>{value}</Badge>;
    }

    if (column.type === "date") {
      return value ? new Date(value).toLocaleDateString() : "";
    }

    return value;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        {/* Search and Filters */}
        <div className="flex flex-wrap gap-2">
          {searchFields.length > 0 && (
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 w-full sm:w-auto min-w-[200px]"
              />
            </div>
          )}

          {/* Filters */}
          {filters.map((filter) => (
            <DropdownMenu key={filter.key}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  {filter.label}
                  {activeFilters[filter.key] && (
                    <Badge variant="secondary" className="ml-2">
                      {Array.isArray(activeFilters[filter.key])
                        ? activeFilters[filter.key].length
                        : "1"}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by {filter.label}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {filter.options.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={
                      Array.isArray(activeFilters[filter.key])
                        ? activeFilters[filter.key]?.includes(option.value)
                        : activeFilters[filter.key] === option.value
                    }
                    onCheckedChange={(checked) => {
                      if (filter.multiple) {
                        const currentValues = activeFilters[filter.key] || [];
                        handleFilterChange(
                          filter.key,
                          checked
                            ? [...currentValues, option.value]
                            : currentValues.filter((v) => v !== option.value)
                        );
                      } else {
                        handleFilterChange(
                          filter.key,
                          checked ? option.value : undefined
                        );
                      }
                    }}
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ))}

          {Object.keys(activeFilters).length > 0 && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Clear Filters
            </Button>
          )}
        </div>

        {/* Column visibility settings */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Visible Columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {columns.map((column) => (
              <DropdownMenuCheckboxItem
                key={column.accessor}
                checked={visibleColumns.includes(column.accessor)}
                onCheckedChange={() => toggleColumnVisibility(column.accessor)}
              >
                {column.header}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns
                .filter((column) => visibleColumns.includes(column.accessor))
                .map((column) => (
                  <TableHead
                    key={column.accessor}
                    className={column.sortable ? "cursor-pointer" : ""}
                    onClick={
                      column.sortable
                        ? () => handleSort(column.accessor)
                        : undefined
                    }
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.header}</span>
                      {sortConfig.key === column.accessor && (
                        <>
                          {sortConfig.direction === "asc" ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </>
                      )}
                    </div>
                  </TableHead>
                ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="h-24 text-center"
                >
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item, index) => (
                <TableRow
                  key={item.id || index}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`
                    ${onRowClick ? "cursor-pointer hover:bg-muted/50" : ""} 
                    ${rowClassName ? rowClassName(item) : ""}
                  `}
                >
                  {columns
                    .filter((column) =>
                      visibleColumns.includes(column.accessor)
                    )
                    .map((column) => (
                      <TableCell key={`${index}-${column.accessor}`}>
                        {renderCell(item, column)}
                      </TableCell>
                    ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 items-center">
        {/* Items per page selector */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>Rows per page:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 py-0">
                {itemsPerPage}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {itemsPerPageOptions.map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => {
                    setItemsPerPage(option);
                    setCurrentPage(1);
                  }}
                >
                  {option}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <span>{filteredData.length} items total</span>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Simple pagination logic for up to 5 pages
                let pageNum = i + 1;
                if (totalPages > 5) {
                  if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                }

                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNum)}
                      isActive={currentPage === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
}

