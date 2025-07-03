"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Project } from "@/lib/types";
import { Users, Calendar, Briefcase, Link as LinkIcon } from "lucide-react";
import { format, parseISO } from "date-fns";

interface ProjectCardProps {
  project: Project;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, projectId: string) => void;
}

export function ProjectCard({ project, onDragStart }: ProjectCardProps) {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    onDragStart(e, project.id);
  };

  return (
    <Card 
      draggable 
      onDragStart={handleDragStart} 
      className="mb-4 cursor-grab active:cursor-grabbing bg-card shadow-sm hover:shadow-lg transition-shadow duration-200"
      aria-roledescription={`Draggable project card for ${project.name}`}
    >
      <CardHeader className="pb-4">
        <CardTitle className="font-headline text-base">{project.name}</CardTitle>
        <CardDescription>{project.epicNumber}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
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
            {format(parseISO(project.startDate), "MMM d")} - {format(parseISO(project.endDate), "MMM d, yyyy")}
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
  );
}
