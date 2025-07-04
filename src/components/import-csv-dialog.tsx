
"use client";

import { useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@/lib/types";
import { format, isValid } from "date-fns";
import { Upload } from "lucide-react";
import { Label } from "@/components/ui/label";

interface ImportCsvDialogProps {
  onProjectsAdd: (projects: Project[]) => void;
}

export function ImportCsvDialog({ onProjectsAdd }: ImportCsvDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!file) return;

    setIsImporting(true);
    Papa.parse<string[]>(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const dataRows = results.data;
          
          const firstRowIsHeader = dataRows[0].some(cell => 
              /project name/i.test(cell) ||
              /epic number/i.test(cell) ||
              /team/i.test(cell) ||
              /impact/i.test(cell)
          );

          const projectsToParse = firstRowIsHeader ? dataRows.slice(1) : dataRows;

          if(projectsToParse.length === 0){
            throw new Error("CSV file is empty or contains only a header.");
          }

          const newProjects: Project[] = projectsToParse.map((row, index) => {
            const rowIndexForError = firstRowIsHeader ? index + 2 : index + 1;
            const [name, epicNumber, team, impact, owner, support, dependencies, startDateStr, endDateStr] = row;

            if (!name || !epicNumber || !team || !startDateStr || !endDateStr) {
              throw new Error(`Row ${rowIndexForError} is incomplete. Project Name, Epic Number, Team, Start Date, and End Date are required.`);
            }
            
            const startDate = new Date(startDateStr);
            const endDate = new Date(endDateStr);

            if (!isValid(startDate) || !isValid(endDate)) {
                throw new Error(`Invalid date format in row ${rowIndexForError}. Please use a valid date format (e.g., YYYY-MM-DD).`);
            }

            return {
              id: `proj-${Date.now()}-${index}`,
              name,
              epicNumber,
              team,
              impact: impact || "",
              owner: owner || "",
              support: support || "",
              dependencies: dependencies || "",
              startDate: format(startDate, "yyyy-MM-dd"),
              endDate: format(endDate, "yyyy-MM-dd"),
            };
          });

          onProjectsAdd(newProjects);
          toast({
            title: "Import Successful",
            description: `${newProjects.length} projects have been added.`,
          });
          setOpen(false);
          setFile(null);
        } catch (error: any) {
          toast({
            title: "Import Failed",
            description: error.message || "An unknown error occurred while parsing the CSV.",
            variant: "destructive",
            duration: 7000,
          });
        } finally {
          setIsImporting(false);
        }
      },
      error: (error) => {
        toast({
          title: "Import Error",
          description: error.message,
          variant: "destructive",
        });
        setIsImporting(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Upload className="mr-2 h-4 w-4" /> Import from CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="font-headline">Import Projects from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to add multiple projects at once.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="p-4 bg-muted/50 rounded-md text-sm text-muted-foreground">
                <p className="font-semibold text-foreground mb-2">CSV Format</p>
                <p>Ensure your CSV has the following columns in this exact order:</p>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Project Name</li>
                    <li>Epic Number</li>
                    <li>Team</li>
                    <li>Impact</li>
                    <li>Owner</li>
                    <li>Support</li>
                    <li>Dependencies</li>
                    <li>Start Date</li>
                    <li>End Date</li>
                </ol>
                 <p className="mt-2 text-xs">A header row is optional and will be skipped if detected.</p>
            </div>
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="csv-file">CSV File</Label>
            <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} className="cursor-pointer"/>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Cancel</Button>
          </DialogClose>
          <Button onClick={handleImport} disabled={!file || isImporting}>
            {isImporting ? "Importing..." : "Import Projects"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
