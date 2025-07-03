"use client";

import type { Project, Quarter } from "@/lib/types";
import { ProjectCard } from "./project-card";

interface TimelineQuarterProps {
  quarter: Quarter;
  projects: Project[];
  onDragStart: (e: React.DragEvent<HTMLDivElement>, projectId: string) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, quarter: Quarter) => void;
}

export function TimelineQuarter({ quarter, projects, onDragStart, onDrop }: TimelineQuarterProps) {
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    onDrop(e, quarter);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="flex flex-col bg-card/50 rounded-lg p-4 h-full border-2 border-dashed border-transparent"
      aria-label={`Timeline quarter ${quarter}, drop zone for projects`}
    >
      <h2 className="font-headline text-xl font-semibold mb-4 text-center text-primary">
        Q{quarter}
      </h2>
      <div className="flex-grow min-h-64 space-y-4 overflow-y-auto p-1">
        {projects.length > 0 ? (
          projects.map((project) => (
            <ProjectCard key={project.id} project={project} onDragStart={onDragStart} />
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground/80 border-2 border-dashed border-border rounded-md p-4 text-center">
            Drop projects here
          </div>
        )}
      </div>
    </div>
  );
}
