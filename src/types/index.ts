/** Shared domain types used throughout the application. */

export type Tag = {
    id: string;
    name: string;
    color?: string | null;
};

export type TimeEntry = {
    id: string;
    description: string | null;
    project_id: string | null;
    project_name?: string | null;
    project_color?: string | null;
    started_at: string;
    ended_at: string | null;
    duration_seconds: number | null;
    /** Entry-specific tags (not including project-inherited tags). */
    entry_tags?: Tag[];
};

export type Project = {
    id: string;
    name: string;
    color?: string;
    /** Tags assigned to this project — inherited by all its entries. */
    tags?: Tag[];
};

/** A single row produced for CSV export. */
export type ExportRow = {
    date: string;
    project: string;
    description: string;
    started_at: string;
    ended_at: string;
    duration_hms: string;
    duration_seconds: number | string;
};
