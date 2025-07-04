
"use client";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ListFilter } from "lucide-react";

interface MultiSelectFilterProps {
  label: string;
  options: string[];
  selectedValues: string[];
  onSelectedValuesChange: (values: string[]) => void;
}

export function MultiSelectFilter({
  label,
  options,
  selectedValues,
  onSelectedValuesChange,
}: MultiSelectFilterProps) {
  const handleSelect = (value: string) => {
    const newSelectedValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onSelectedValuesChange(newSelectedValues);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto justify-start">
          <ListFilter className="mr-2 h-4 w-4" />
          <span>{label}</span>
          {selectedValues.length > 0 && (
            <span className="ml-2 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              {selectedValues.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 max-h-40 overflow-y-auto" align="start">
        <DropdownMenuLabel>{`Filter by ${label}`}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.length > 0 ? (
          options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option}
              checked={selectedValues.includes(option)}
              onSelect={(e) => {
                e.preventDefault();
                handleSelect(option);
              }}
            >
              {option}
            </DropdownMenuCheckboxItem>
          ))
        ) : (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            No options available
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
