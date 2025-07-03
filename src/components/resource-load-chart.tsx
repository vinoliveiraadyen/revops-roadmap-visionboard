
"use client";

import { useMemo } from 'react';
import type { Project } from '@/lib/types';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from '@/components/ui/chart';
import { eachMonthOfInterval, endOfMonth, format, getYear, parseISO, startOfMonth, startOfYear, endOfYear } from 'date-fns';

const sanitizeForCssIdentifier = (name: string) => {
    // Replaces all non-alphanumeric characters with underscores to ensure a valid CSS identifier.
    return name.replace(/[^a-zA-Z0-9]/g, '_');
}

export function ResourceLoadChart({ projects }: { projects: Project[] }) {
    const { chartData, allResources, year } = useMemo(() => {
        if (!projects || projects.length === 0) {
            return { chartData: [], allResources: [], year: new Date().getFullYear() };
        }

        const resourcesSet = new Set<string>();
        projects.forEach(p => {
            p.resources.split(',').forEach(r => {
                const trimmed = r.trim();
                if(trimmed) resourcesSet.add(trimmed);
            });
        });
        const allResources = [...resourcesSet].sort();

        const firstProjectWithDate = projects.find(p => p.startDate);
        const displayYear = firstProjectWithDate ? getYear(parseISO(firstProjectWithDate.startDate)) : new Date().getFullYear();

        const months = eachMonthOfInterval({
            start: startOfYear(new Date(displayYear, 0, 1)),
            end: endOfYear(new Date(displayYear, 11, 31))
        });

        const data = months.map(month => {
            const monthData: { name: string; [key: string]: number | string } = {
                name: format(month, 'MMM'),
            };

            // Initialize all sanitized resources with 0 for this month
            allResources.forEach(resource => {
                monthData[sanitizeForCssIdentifier(resource)] = 0;
            });

            projects.forEach(project => {
                try {
                    const projectStart = parseISO(project.startDate);
                    const projectEnd = parseISO(project.endDate);
                    const monthStart = startOfMonth(month);
                    const monthEnd = endOfMonth(month);

                    if (projectStart <= monthEnd && projectEnd >= monthStart) {
                        project.resources.split(',').map(r => r.trim()).forEach(resource => {
                            if (!resource) return;
                            const sanitizedResource = sanitizeForCssIdentifier(resource);
                            if (monthData.hasOwnProperty(sanitizedResource)) {
                                (monthData[sanitizedResource] as number) += 1;
                            }
                        });
                    }
                } catch(e) {
                    console.error("Invalid date for project:", project.name, e);
                }
            });

            return monthData;
        });

        return { chartData: data, allResources, year: displayYear };
    }, [projects]);
    
    const chartConfig = useMemo(() => {
        const config: ChartConfig = {};
        allResources.forEach((resource, index) => {
            // Use the sanitized key for the config, but the original name for the label
            config[sanitizeForCssIdentifier(resource)] = {
                label: resource,
                color: `hsl(var(--chart-${(index % 5) + 1}))`,
            };
        });
        return config as ChartConfig;
    }, [allResources]);

    if (chartData.length === 0 || allResources.length === 0) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Resource Load - {year}</CardTitle>
                    <CardDescription>Number of projects assigned per resource each month.</CardDescription>
                </CardHeader>
                <CardContent className="flex h-[300px] items-center justify-center">
                    <p className="text-muted-foreground">
                        No projects to display. Try adjusting filters or adding projects.
                    </p>
                </CardContent>
             </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Resource Load - {year}</CardTitle>
                <CardDescription>Number of projects assigned per resource each month.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                    <BarChart accessibilityLayer data={chartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="name"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            fontSize={12}
                        />
                        <YAxis 
                            tickMargin={8}
                            allowDecimals={false}
                            fontSize={12}
                        />
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent indicator="dot" />}
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                        {allResources.map((resource) => {
                            const sanitizedResource = sanitizeForCssIdentifier(resource);
                            return (
                                <Bar
                                    key={sanitizedResource}
                                    dataKey={sanitizedResource}
                                    stackId="a"
                                    fill={`var(--color-${sanitizedResource})`}
                                    radius={[4, 4, 0, 0]}
                                />
                            )
                        })}
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
