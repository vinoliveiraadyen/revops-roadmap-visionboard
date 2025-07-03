"use client";

import type { Project } from "@/lib/types";
import {
  startOfYear,
  differenceInDays,
  parseISO,
  format,
  getYear,
} from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Users, Calendar, Briefcase, Link as LinkIcon } from "lucide-react";

// Helper function to get the total number of days in a year
const getDaysInYear = (date: Date) => {
  const year = getYear(date);
  // Check for leap year
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
};


const TimelineProject = ({ project, year, rowIndex }: { project: Project; year: number; rowIndex: number }) => {
  const projectStart = parseISO(project.startDate);
  const projectEnd = parseISO(project.endDate);
  
  if (projectStart.getFullYear() > year || projectEnd.getFullYear() < year) return null;

  const yearStartDate = startOfYear(new Date(year, 0, 1));
  const totalDays = getDaysInYear(yearStartDate);

  const startDay = differenceInDays(projectStart, yearStartDate);
  const duration = differenceInDays(projectEnd, projectStart) + 1;
  
  const clampedStartDay = Math.max(0, startDay);
  const clampedEndDay = Math.min(totalDays, startDay + duration);
  const clampedDuration = clampedEndDay - clampedStartDay;

  if (clampedDuration <= 0) return null;

  const left = (clampedStartDay / totalDays) * 100;
  const width = (clampedDuration / totalDays) * 100;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          className="absolute h-10 bg-primary/80 rounded-lg flex items-center px-3 text-primary-foreground hover:bg-primary transition-colors cursor-pointer shadow-md"
          style={{
            left: `${left}%`,
            width: `${width}%`,
            top: `${2.5 + rowIndex * 3}rem`, 
          }}
        >
          <p className="text-sm font-medium truncate">{project.name}</p>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <Card className="border-none shadow-none">
          <CardHeader className="pb-4 px-2 pt-2">
            <CardTitle className="font-headline text-base">{project.name}</CardTitle>
            <CardDescription>{project.epicNumber}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm px-2 pb-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4 flex-shrink-0" />
              <span>{project.team}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Briefcase className="h-4 w-4 flex-shrink-0" />
              <span>{project.resources}</span>
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
      .filter(p => getYear(parseISO(p.startDate)) === year)
      .sort((a,b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime());

    sortedProjects.forEach(project => {
        let placed = false;
        const projectStart = parseISO(project.startDate);
        for (const row of rows) {
            const lastProjectInRow = row[row.length - 1];
            if (projectStart > lastProjectInRow.endDate) {
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

export function Timeline({ projects }: { projects: Project[] }) {
  const year = projects.length > 0 ? getYear(parseISO(projects[0].startDate)) : new Date().getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => format(new Date(year, i, 1), "MMM"));
  const { projectRowMap, rowCount } = getProjectRows(projects, year);
  const timelineHeight = (rowCount * 3) + 8; // 3rem per row + padding

  return (
    <div className="bg-card/50 rounded-lg p-4 relative" style={{ minHeight: `${timelineHeight}rem` }}>
      <div className="relative h-full">
        {/* Month Markers */}
        <div className="grid grid-cols-12 h-full absolute inset-0">
          {months.map((month, i) => (
            <div key={month} className={`h-full ${i < 11 ? 'border-r border-dashed border-border' : ''}`}>
              <div className="p-2 text-sm font-semibold text-muted-foreground">{month}</div>
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
        <div className="relative pt-12 h-full">
          {projects.map((project) => (
            <TimelineProject key={project.id} project={project} year={year} rowIndex={projectRowMap.get(project.id) || 0} />
          ))}
        </div>
      </div>
    </div>
  );
}
