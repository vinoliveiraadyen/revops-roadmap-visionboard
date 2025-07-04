
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

export function ResourceLoadChart({ projects, selectedOwners }: { projects: Project[]; selectedOwners?: string[] }) {
    const { chartData, ownersToDisplay, year } = useMemo(() => {
        if (!projects || projects.length === 0) {
            return { chartData: [], ownersToDisplay: [], year: new Date().getFullYear() };
        }

        const ownersSet = new Set<string>();
        projects.forEach(p => {
            p.owner.split(',').forEach(r => {
                const trimmed = r.trim();
                if(trimmed) ownersSet.add(trimmed);
            });
        });
        const allOwners = [...ownersSet].sort();

        const ownersToDisplay = selectedOwners && selectedOwners.length > 0 
            ? allOwners.filter(o => selectedOwners.includes(o)) 
            : allOwners;

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

            // Initialize all sanitized owners with 0 for this month
            ownersToDisplay.forEach(owner => {
                monthData[sanitizeForCssIdentifier(owner)] = 0;
            });

            projects.forEach(project => {
                try {
                    const projectStart = parseISO(project.startDate);
                    const projectEnd = parseISO(project.endDate);
                    const monthStart = startOfMonth(month);
                    const monthEnd = endOfMonth(month);

                    if (projectStart <= monthEnd && projectEnd >= monthStart) {
                        project.owner.split(',').map(r => r.trim()).forEach(owner => {
                            if (!owner) return;
                            const sanitizedOwner = sanitizeForCssIdentifier(owner);
                            if (monthData.hasOwnProperty(sanitizedOwner)) {
                                (monthData[sanitizedOwner] as number) += 1;
                            }
                        });
                    }
                } catch(e) {
                    console.error("Invalid date for project:", project.name, e);
                }
            });

            return monthData;
        });

        return { chartData: data, ownersToDisplay, year: displayYear };
    }, [projects, selectedOwners]);
    
    const chartConfig = useMemo(() => {
        const config: ChartConfig = {};
        ownersToDisplay.forEach((owner, index) => {
            // Use the sanitized key for the config, but the original name for the label
            config[sanitizeForCssIdentifier(owner)] = {
                label: owner,
                color: `hsl(var(--chart-${(index % 5) + 1}))`,
            };
        });
        return config as ChartConfig;
    }, [ownersToDisplay]);

    if (chartData.length === 0 || ownersToDisplay.length === 0) {
        return (
            <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed">
                <p className="text-muted-foreground text-center p-4">
                    No project data to display. <br/> Try adjusting filters or adding projects.
                </p>
            </div>
        )
    }

    return (
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
                {ownersToDisplay.map((owner) => {
                    const sanitizedOwner = sanitizeForCssIdentifier(owner);
                    return (
                        <Bar
                            key={sanitizedOwner}
                            dataKey={sanitizedOwner}
                            stackId="a"
                            fill={`var(--color-${sanitizedOwner})`}
                            radius={[4, 4, 0, 0]}
                        />
                    )
                })}
            </BarChart>
        </ChartContainer>
    );
}
