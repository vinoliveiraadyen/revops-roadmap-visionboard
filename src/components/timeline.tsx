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

const TEAM_COLORS = [
  "207 82% 68%", // blueish (primary)
  "12 76% 61%",  // orange (chart-1)
  "150 83% 68%", // greenish (accent)
  "280 65% 60%", // purple (chart-4 dark)
  "43 74% 66%",  // yellow (chart-4)
  "340 75% 55%", // pinkish (chart-5 dark)
  "173 58% 39%", // dark green (chart-2)
  "27 87% 67%",  // light orange (chart-5)
];

const getTeamColor = (teamName: string): string => {
  if (!teamName) return `hsl(${TEAM_COLORS[0]})`;
  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0; // Convert to 32bit integer
  }
  const colorIndex = Math.abs(hash % TEAM_COLORS.length);
  return `hsl(${TEAM_COLORS[colorIndex]})`;
};


const TimelineProject = ({ project, year, rowIndex }: { project: Project; year: number; rowIndex: number }) => {
  const projectStart = parseISO(project.startDate);
  const projectEnd = parseISO(project.endDate);
  
  if (getYear(projectStart) > year || getYear(projectEnd) < year) return null;

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
  const teamColor = getTeamColor(project.team);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          className="absolute h-12 bg-card rounded-md flex flex-col justify-center px-3 text-card-foreground hover:bg-muted transition-colors cursor-pointer shadow-sm border-l-4 overflow-hidden"
          style={{
            left: `${left}%`,
            width: `${width}%`,
            top: `${2.5 + rowIndex * 3.5}rem`, 
            borderColor: teamColor,
          }}
        >
          <p className="text-sm font-medium truncate">{project.name}</p>
          <p className="text-xs text-muted-foreground truncate">{project.resources}</p>
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
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: teamColor }}
                />
                <span>{project.team}</span>
              </div>
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

export function Timeline({ projects }: { projects: Project[] }) {
  const allYears = Array.from(new Set(projects.flatMap(p => {
    try {
      return [getYear(parseISO(p.startDate)), getYear(parseISO(p.endDate))];
    } catch (e) {
      return [];
    }
  }))).sort();
  const displayYear = allYears.length > 0 ? allYears[0] : new Date().getFullYear();
  
  const months = Array.from({ length: 12 }, (_, i) => format(new Date(displayYear, i, 1), "MMM"));
  const { projectRowMap, rowCount } = getProjectRows(projects, displayYear);
  const timelineHeight = (rowCount * 3.5) + 8; // 3.5rem per row + padding

  return (
    <div className="bg-card/50 rounded-lg p-4 relative" style={{ minHeight: `${timelineHeight}rem` }}>
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
        <div className="relative pt-12 h-full">
          {projects.map((project) => (
            <TimelineProject key={project.id} project={project} year={displayYear} rowIndex={projectRowMap.get(project.id) || 0} />
          ))}
        </div>
      </div>
    </div>
  );
}
