
"use client";

import type { Project } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type SortConfig = {
    key: keyof Project | null;
    direction: 'ascending' | 'descending';
};

interface ProjectTableProps {
  projects: Project[];
  onProjectEdit: (project: Project) => void;
  onProjectDelete: (projectId: string) => void;
  onDeleteAll: () => void;
  sortConfig: SortConfig;
  onSort: (key: keyof Project) => void;
}

export function ProjectTable({ projects, onProjectEdit, onProjectDelete, onDeleteAll, sortConfig, onSort }: ProjectTableProps) {
  const ragStatusColor = {
    Green: 'bg-green-500',
    Amber: 'bg-amber-500',
    Red: 'bg-red-500',
  };
  
  const SortableHeader = ({ column, label }: { column: keyof Project; label: string }) => {
    const isSorted = sortConfig.key === column;
    return (
      <TableHead>
        <Button variant="ghost" onClick={() => onSort(column)} className="-ml-4 h-8">
          {label}
          {isSorted ? (
            <ArrowUpDown className={cn("ml-2 h-4 w-4", sortConfig.direction === 'descending' && 'rotate-180')} />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-50" />
          )}
        </Button>
      </TableHead>
    );
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="group">
            <SortableHeader column="name" label="Project Name" />
            <SortableHeader column="epicNumber" label="Epic" />
            <SortableHeader column="revopsTeam" label="RevOps Team" />
            <SortableHeader column="function" label="Function" />
            <SortableHeader column="progress" label="Progress" />
            <SortableHeader column="ragStatus" label="RAG" />
            <SortableHeader column="assignee" label="Assignee" />
            <SortableHeader column="support" label="Support" />
            <SortableHeader column="dependencies" label="Dependencies" />
            <SortableHeader column="startDate" label="Start Date" />
            <SortableHeader column="endDate" label="End Date" />
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.length > 0 ? (
            projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell>{project.epicNumber}</TableCell>
                <TableCell>{project.revopsTeam}</TableCell>
                <TableCell>{project.function}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={project.progress} className="w-24" />
                    <span className="text-muted-foreground text-xs">{project.progress || 0}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  {project.ragStatus && (
                    <div className="flex items-center gap-2">
                      <div className={cn("h-3 w-3 rounded-full", ragStatusColor[project.ragStatus as keyof typeof ragStatusColor])} />
                      {project.ragStatus}
                    </div>
                  )}
                </TableCell>
                <TableCell>{project.assignee}</TableCell>
                <TableCell>{project.support}</TableCell>
                <TableCell>{project.dependencies}</TableCell>
                <TableCell>{project.startDate}</TableCell>
                <TableCell>{project.endDate}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onProjectEdit(project)}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the "{project.name}" project.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onProjectDelete(project.id)}
                            className={buttonVariants({ variant: "destructive" })}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
                <TableCell colSpan={12} className="h-24 text-center">
                    No projects found.
                </TableCell>
            </TableRow>
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={12} className="text-right p-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={projects.length === 0}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete All Projects
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete all {projects.length} projects from the board.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onDeleteAll}
                      className={buttonVariants({ variant: "destructive" })}
                    >
                      Delete All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
