
"use client";

import { Download } from "lucide-react";
import Papa from "papaparse";
import type { Project } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface ExportCsvButtonProps {
  projects: Project[];
  fileName?: string;
}

export function ExportCsvButton({ projects, fileName = "projects.csv" }: ExportCsvButtonProps) {
  const handleExport = () => {
    // Map data to match the expected CSV format, especially the headers.
    const dataToExport = projects.map(p => ({
      "Project Name": p.name,
      "Epic Number": p.epicNumber,
      "Team": p.team,
      "Impact": p.impact,
      "Start Date": p.startDate,
      "End Date": p.endDate,
      "Resources": p.resources,
    }));
    
    // Convert JSON to CSV string. The `columns` option ensures the header order.
    const csv = Papa.unparse(dataToExport, {
        header: true,
        columns: ["Project Name", "Epic Number", "Team", "Impact", "Start Date", "End Date", "Resources"]
    });
    
    // Create a Blob and trigger a download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={handleExport}
      disabled={projects.length === 0}
    >
      <Download className="mr-2 h-4 w-4" /> Export to CSV
    </Button>
  );
}
