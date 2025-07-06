
"use client";

import * as React from "react";
import type { Project } from "@/lib/types";
import {
  startOfYear,
  differenceInCalendarDays,
  parseISO,
  format,
  getYear,
  addDays,
} from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Users, Calendar, Briefcase, Link as LinkIcon, Trash2, Pencil, Zap, LifeBuoy } from "lucide-react";
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
import { Button, buttonVariants } from "@/components/ui/button";

// Helper function to get the total number of days in a year
const getDaysInYear = (date: Date) => {
  const year = getYear(date);
  // Check for leap year
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
};

const TEAM_COLORS = [
  "210 90% 55%", // Bright Blue
  "340 85% 60%", // Bright Red-Pink
  "145 70% 45%", // Strong Green
  "35 95% 55%",  // Bright Orange
  "265 80% 65%", // Vibrant Purple
  "190 85% 50%", // Teal
  "50 100% 55%", // Gold
  "280 70% 60%", // Indigo
  "0 80% 60%",   // Strong Red
  "170 75% 45%", // Sea Green
  "300 80% 65%", // Magenta
  "25 90% 50%",  // Brownish Orange
];

const TimelineProject = ({ project, year, rowIndex, onDelete, onEdit, getTeamColor }: { project: Project; year: number; rowIndex: number; onDelete: (projectId: string) => void; onEdit: (project: Project) => void; getTeamColor: (teamName: string) => string; }) => {
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const projectStart = parseISO(project.startDate);
  const projectEnd = parseISO(project.endDate);
  
  if (getYear(projectStart) > year || getYear(projectEnd) < year) return null;

  const yearStartDate = startOfYear(new Date(year, 0, 1));
  const totalDays = getDaysInYear(yearStartDate);

  const startDay = differenceInCalendarDays(projectStart, yearStartDate);
  const duration = differenceInCalendarDays(projectEnd, projectStart) + 1;
  
  const clampedStartDay = Math.max(0, startDay);
  const clampedEndDay = Math.min(totalDays, startDay + duration);
  const clampedDuration = clampedEndDay - clampedStartDay;

  if (clampedDuration <= 0) return null;

  const left = (clampedStartDay / totalDays) * 100;
  const width = (clampedDuration / totalDays) * 100;
  const teamColor = getTeamColor(project.team);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("projectId", project.id);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const offset = e.clientX - rect.left;
    e.dataTransfer.setData("dragOffset", offset.toString());
  };

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <div
          draggable
          onDragStart={handleDragStart}
          className="absolute h-12 bg-card rounded-md flex flex-col justify-center px-3 text-card-foreground hover:bg-muted transition-colors cursor-grab active:cursor-grabbing shadow-sm border-l-4 overflow-hidden"
          style={{
            left: `${left}%`,
            width: `${width}%`,
            top: `${4 + rowIndex * 3.5}rem`, 
            borderColor: teamColor,
          }}
        >
          <p className="text-sm font-medium truncate">{project.name}</p>
          <p className="text-xs text-muted-foreground truncate">{project.owner}</p>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => onEdit(project)}>
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit Project</span>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete Project</span>
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
                    onClick={() => {
                      onDelete(project.id)
                      setPopoverOpen(false)
                    }}
                    className={buttonVariants({ variant: "destructive" })}
                  >
                    Delete
                  </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <Card className="border-none shadow-none">
          <CardHeader className="pb-4 px-2 pt-2">
            <CardTitle className="font-headline text-base">{project.name}</CardTitle>
            <CardDescription>{project.epicNumber}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm px-2 pb-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4 flex-shrink-0" />
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: teamColor }}
                />
                <span>{project.team}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="h-4 w-4 flex-shrink-0" />
              <span>Impact: {project.impact}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Briefcase className="h-4 w-4 flex-shrink-0" />
              <span>{project.owner}</span>
            </div>
             <div className="flex items-center gap-2 text-muted-foreground">
              <LifeBuoy className="h-4 w-4 flex-shrink-0" />
              <span>{project.support}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>
                {format(parseISO(project.startDate), "MMM d, yyyy")} - {format(parseISO(project.endDate), "MMM d, yyyy")}
              </span>
            </div>
            {project.dependencies && project.dependencies.toLowerCase() !== 'none' && (
              <div className="flex items-start gap-2 text-muted-foreground">
                <LinkIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="flex-1">Dependencies: {project.dependencies}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

const getProjectRows = (projects: Project[], year: number) => {
    const rows: {project: Project, endDate: Date}[][] = [];
    const sortedProjects = [...projects]
      .filter(p => {
          try {
            const startYear = getYear(parseISO(p.startDate));
            const endYear = getYear(parseISO(p.endDate));
            return startYear <= year && endYear >= year;
          } catch(e) {
            return false;
          }
        })
      .sort((a,b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime());

    sortedProjects.forEach(project => {
        let placed = false;
        const projectStart = parseISO(project.startDate);
        for (const row of rows) {
            const lastProjectInRow = row[row.length - 1];
            if (projectStart >= lastProjectInRow.endDate) {
                row.push({project, endDate: parseISO(project.endDate)});
                placed = true;
                break;
            }
        }
        if (!placed) {
            rows.push([{project, endDate: parseISO(project.endDate)}]);
        }
    });

    const projectRowMap = new Map<string, number>();
    rows.forEach((row, rowIndex) => {
        row.forEach(item => {
            projectRowMap.set(item.project.id, rowIndex);
        });
    });

    return {projectRowMap, rowCount: rows.length};
}

export function Timeline({ projects, onProjectDelete, onProjectEdit, onProjectMove, displayYear }: { projects: Project[]; onProjectDelete: (projectId: string) => void; onProjectEdit: (project: Project) => void; onProjectMove: (projectId: string, newStartDate: Date) => void; displayYear: number; }) {
  const months = Array.from({ length: 12 }, (_, i) => format(new Date(displayYear, i, 1), "MMM"));
  
  const { projectRowMap, rowCount } = React.useMemo(() => getProjectRows(projects, displayYear), [projects, displayYear]);

  const timelineHeight = (rowCount * 3.5) + 9.5; // 3.5rem per row + padding

  const teamColorMap = React.useMemo(() => {
    const uniqueTeams = [...new Set(projects.map(p => p.team).filter(Boolean))].sort();
    const map = new Map<string, string>();
    uniqueTeams.forEach((team, index) => {
      map.set(team, `hsl(${TEAM_COLORS[index % TEAM_COLORS.length]})`);
    });
    return map;
  }, [projects]);


  const getTeamColor = React.useCallback((teamName: string): string => {
    return teamColorMap.get(teamName) || `hsl(${TEAM_COLORS[0]})`;
  }, [teamColorMap]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const projectId = e.dataTransfer.getData("projectId");
    const offsetInPixels = parseFloat(e.dataTransfer.getData("dragOffset") || "0");
    
    if (!projectId) return;

    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const timelineRect = e.currentTarget.getBoundingClientRect();
    
    // Convert drop position to a day of the year
    const dropX = e.clientX - timelineRect.left;
    const newVisualStartX = dropX - offsetInPixels;
    const totalDaysInYear = getDaysInYear(new Date(displayYear, 0, 1));
    const newVisualStartDay = Math.round((newVisualStartX / timelineRect.width) * totalDaysInYear);

    // Calculate how many days the project's visual start has shifted
    const projectStart = parseISO(project.startDate);
    const startOfYearDate = startOfYear(new Date(displayYear, 0, 1));
    const originalVisualStartDay = differenceInCalendarDays(projectStart, startOfYearDate);
    const dayDelta = newVisualStartDay - originalVisualStartDay;

    // Apply the shift to the actual start date
    const newStartDate = addDays(projectStart, dayDelta);

    onProjectMove(projectId, newStartDate);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="bg-card/50 rounded-lg p-4 relative" style={{ minHeight: `${timelineHeight}rem` }} onDrop={handleDrop} onDragOver={handleDragOver}>
      <div className="relative h-full">
        {/* Month Markers */}
        <div className="grid grid-cols-12 h-full absolute inset-0">
          {months.map((month, i) => (
            <div key={month} className={`h-full ${i < 11 ? 'border-r border-dashed border-border' : ''}`}>
              <div className="p-2 pt-6 text-sm font-semibold text-muted-foreground">{month}</div>
            </div>
          ))}
        </div>
        
        {/* Quarter Markers */}
        <div className="grid grid-cols-4 h-full absolute inset-0">
            <div className="h-full border-r-2 border-primary/20 flex items-start justify-center pt-1"><span className="font-headline text-lg font-semibold text-primary/50">Q1</span></div>
            <div className="h-full border-r-2 border-primary/20 flex items-start justify-center pt-1"><span className="font-headline text-lg font-semibold text-primary/50">Q2</span></div>
            <div className="h-full border-r-2 border-primary/20 flex items-start justify-center pt-1"><span className="font-headline text-lg font-semibold text-primary/50">Q3</span></div>
            <div className="h-full flex items-start justify-center pt-1"><span className="font-headline text-lg font-semibold text-primary/50">Q4</span></div>
        </div>

        {/* Projects */}
        <div className="relative pt-16 h-full">
          {projects.map((project) => (
            <TimelineProject key={project.id} project={project} year={displayYear} rowIndex={projectRowMap.get(project.id) || 0} onDelete={onProjectDelete} onEdit={onProjectEdit} getTeamColor={getTeamColor} />
          ))}
        </div>
      </div>
    </div>
  );
}
