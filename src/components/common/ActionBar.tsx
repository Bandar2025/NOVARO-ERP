import React from "react";
import GlobalActionBar, { ActionItem } from "./GlobalActionBar";

interface ActionBarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  totalCount?: number;
  filteredCount?: number;
  filterComponent?: React.ReactNode;
  rightActions?: React.ReactNode;
  onResetFilters?: () => void;
  isFiltered?: boolean;
  language?: "ar" | "en";
  className?: string;
}

export default function ActionBar({
  searchQuery = "",
  onSearchChange,
  searchPlaceholder,
  totalCount,
  filteredCount,
  filterComponent,
  rightActions,
  onResetFilters,
  isFiltered = false,
  language = "ar",
  className = ""
}: ActionBarProps) {
  return (
    <GlobalActionBar
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder={searchPlaceholder}
      totalCount={totalCount}
      filteredCount={filteredCount}
      filterComponent={filterComponent}
      onResetFilters={onResetFilters}
      isFiltered={isFiltered}
      language={language}
      className={className}
    />
  );
}
