/** Shared domain types used throughout the application. */

export type TimeEntry = {
    id: string;
    description: string | null;
    project_id: string | null;
    project_name?: string | null;
    project_color?: string | null;
    started_at: string;
    ended_at: string | null;
    duration_seconds: number | null;
};

export type Project = {
    id: string;
    name: string;
    color?: string;
};
