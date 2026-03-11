"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { extractProjectFields, extractTagsFromJoin } from "@/lib/timeUtils";
import { MAX_RECENT_ENTRIES, DEFAULT_PROJECT_COLOR } from "@/lib/constants";
import type { TimeEntry, Project, Tag } from "@/types";

export interface TimeTrackerData {
    loading: boolean;
    error: string | null;
    setError: (msg: string | null) => void;

    entries: TimeEntry[];
    setEntries: React.Dispatch<React.SetStateAction<TimeEntry[]>>;
    loadEntries: () => Promise<void>;

    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;

    tags: Tag[];
    setTags: React.Dispatch<React.SetStateAction<Tag[]>>;

    selectedProjectId: string;
    setSelectedProjectId: (id: string) => void;

    newProjectName: string;
    setNewProjectName: (name: string) => void;

    newProjectColor: string;
    setNewProjectColor: (color: string) => void;

    creatingProject: boolean;

    insertEntryTags: (entryId: string, tagIds: string[]) => Promise<Tag[]>;

    handleDeleteEntry: (id: string) => Promise<void>;
    handleCreateProject: (e: React.FormEvent) => Promise<void>;
    handleCreateTag: (name: string, color: string) => Promise<void>;
    handleDeleteTag: (id: string) => Promise<void>;
    handleUpdateTagColor: (id: string, color: string) => Promise<void>;
    handleUpdateProjectTags: (projectId: string, tagIds: string[]) => Promise<void>;
    handleDeleteProject: (id: string) => Promise<void>;
    handleUpdateProjectColor: (id: string, color: string) => Promise<void>;
    handleSaveEditEntry: (update: {
        id: string;
        description: string;
        project_id: string;
        started_at: string;
        ended_at: string;
        entry_tag_ids: string[];
    }) => Promise<void>;
}

export function useTimeTrackerData(): TimeTrackerData {
    const supabase = getSupabaseClient();
    // db is supabase with non-null assertion; only used in callbacks that are
    // only reachable when supabase is available (guarded by <SetupScreen />).
    const db = supabase!;

    const [loading, setLoading] = useState(!supabase ? false : true);
    const [error, setError] = useState<string | null>(null);
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [newProjectName, setNewProjectName] = useState("");
    const [newProjectColor, setNewProjectColor] = useState(DEFAULT_PROJECT_COLOR);
    const [creatingProject, setCreatingProject] = useState(false);

    const loadEntries = useCallback(async () => {
        if (!supabase) return;
        const { data, error: err } = await db
            .from("time_entries")
            .select(
                "id, description, project_id, started_at, ended_at, duration_seconds, " +
                "projects(name, color), " +
                "entry_tags(tags(id, name, color))"
            )
            .order("started_at", { ascending: false })
            .limit(MAX_RECENT_ENTRIES);

        if (err) {
            setError(err.message);
        } else {
            setEntries(
                ((data ?? []) as unknown as Record<string, unknown>[]).map((entry) => ({
                    ...(entry as unknown as Omit<TimeEntry, "project_name" | "project_color" | "entry_tags">),
                    ...extractProjectFields(entry.projects),
                    entry_tags: extractTagsFromJoin(entry.entry_tags),
                }))
            );
        }
    }, [supabase]);

    useEffect(() => {
        void loadEntries();
    }, [loadEntries]);

    useEffect(() => {
        const loadProjectsAndTags = async () => {
            if (!supabase) return;
            const [projectsResult, tagsResult] = await Promise.all([
                supabase
                    .from("projects")
                    .select("id, name, color, project_tags(tags(id, name, color))")
                    .order("created_at", { ascending: true }),
                supabase
                    .from("tags")
                    .select("id, name, color")
                    .order("created_at", { ascending: true }),
            ]);

            if (projectsResult.error) {
                setError(projectsResult.error.message);
            } else {
                setProjects(
                    ((projectsResult.data ?? []) as unknown as Record<string, unknown>[]).map((p) => ({
                        ...(p as unknown as Omit<Project, "tags">),
                        tags: extractTagsFromJoin(p.project_tags),
                    }))
                );
            }

            if (tagsResult.error) {
                setError(tagsResult.error.message);
            } else {
                setTags(((tagsResult.data ?? []) as unknown as Tag[]));
            }

            setLoading(false);
        };

        void loadProjectsAndTags();
    }, [supabase]);

    async function insertEntryTags(entryId: string, tagIds: string[]): Promise<Tag[]> {
        if (tagIds.length === 0 || !supabase) return [];
        const { error: err } = await db
            .from("entry_tags")
            .insert(tagIds.map((tag_id) => ({ entry_id: entryId, tag_id })));
        if (err) {
            setError(err.message);
            return [];
        }
        return tags.filter((t) => tagIds.includes(t.id));
    }

    const handleDeleteEntry = async (id: string) => {
        setError(null);
        const { error: err } = await db.from("time_entries").delete().eq("id", id);
        if (err) {
            setError(err.message);
        } else {
            setEntries((prev) => prev.filter((e) => e.id !== id));
        }
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        const name = newProjectName.trim();
        if (!name) return;

        setCreatingProject(true);
        setError(null);

        const { data, error: err } = await db
            .from("projects")
            .insert({ name, color: newProjectColor })
            .select("id, name, color")
            .single();

        if (err) {
            setError(err.message);
        } else if (data) {
            const project: Project = { ...(data as Project), tags: [] };
            setProjects((prev) => [...prev, project]);
            setSelectedProjectId(project.id);
            setNewProjectName(project.name);
            setNewProjectColor(DEFAULT_PROJECT_COLOR);
        }

        setCreatingProject(false);
    };

    const handleCreateTag = async (name: string, color: string) => {
        setError(null);
        const { data, error: err } = await db
            .from("tags")
            .insert({ name, color })
            .select("id, name, color")
            .single();
        if (err) {
            setError(err.message);
        } else if (data) {
            setTags((prev) => [...prev, data as unknown as Tag]);
        }
    };

    const handleDeleteTag = async (id: string) => {
        setError(null);
        const { error: err } = await db.from("tags").delete().eq("id", id);
        if (err) {
            setError(err.message);
        } else {
            setTags((prev) => prev.filter((t) => t.id !== id));
            setProjects((prev) =>
                prev.map((p) => ({ ...p, tags: (p.tags ?? []).filter((t) => t.id !== id) }))
            );
            setEntries((prev) =>
                prev.map((e) => ({ ...e, entry_tags: (e.entry_tags ?? []).filter((t) => t.id !== id) }))
            );
        }
    };

    const handleUpdateTagColor = async (id: string, color: string) => {
        setError(null);
        const { error: err } = await db.from("tags").update({ color }).eq("id", id);
        if (err) {
            setError(err.message);
        } else {
            setTags((prev) => prev.map((t) => (t.id === id ? { ...t, color } : t)));
            setProjects((prev) =>
                prev.map((p) => ({ ...p, tags: (p.tags ?? []).map((t) => (t.id === id ? { ...t, color } : t)) }))
            );
            setEntries((prev) =>
                prev.map((e) => ({ ...e, entry_tags: (e.entry_tags ?? []).map((t) => (t.id === id ? { ...t, color } : t)) }))
            );
        }
    };

    const handleUpdateProjectTags = async (projectId: string, tagIds: string[]) => {
        setError(null);
        await db.from("project_tags").delete().eq("project_id", projectId);
        if (tagIds.length > 0) {
            const { error: err } = await db
                .from("project_tags")
                .insert(tagIds.map((tag_id) => ({ project_id: projectId, tag_id })));
            if (err) {
                setError(err.message);
                return;
            }
        }
        const newTags = tags.filter((t) => tagIds.includes(t.id));
        setProjects((prev) =>
            prev.map((p) => (p.id === projectId ? { ...p, tags: newTags } : p))
        );
    };

    const handleDeleteProject = async (id: string) => {
        setError(null);
        const { error: err } = await db.from("projects").delete().eq("id", id);
        if (err) {
            setError(err.message);
        } else {
            setProjects((prev) => prev.filter((p) => p.id !== id));
            if (selectedProjectId === id) setSelectedProjectId("");
        }
    };

    const handleUpdateProjectColor = async (id: string, color: string) => {
        setError(null);
        const { error: err } = await db.from("projects").update({ color }).eq("id", id);
        if (err) {
            setError(err.message);
        } else {
            setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, color } : p)));
            setEntries((prev) =>
                prev.map((e) => (e.project_id === id ? { ...e, project_color: color } : e))
            );
        }
    };

    const handleSaveEditEntry = async (update: {
        id: string;
        description: string;
        project_id: string;
        started_at: string;
        ended_at: string;
        entry_tag_ids: string[];
    }) => {
        const { data, error: err } = await db
            .from("time_entries")
            .update({
                description: update.description,
                project_id: update.project_id,
                started_at: update.started_at,
                ended_at: update.ended_at,
            })
            .eq("id", update.id)
            .select(
                "id, description, project_id, started_at, ended_at, duration_seconds, " +
                "projects(name, color)"
            )
            .single();

        if (err) {
            setError(err.message);
            throw err;
        } else if (data) {
            const { error: deleteErr } = await db.from("entry_tags").delete().eq("entry_id", update.id);
            if (deleteErr) {
                setError(deleteErr.message);
                throw deleteErr;
            }
            const entryTags = await insertEntryTags(update.id, update.entry_tag_ids);
            setEntries((prev) =>
                prev.map((e) =>
                    e.id === update.id
                        ? {
                            ...(data as unknown as Omit<TimeEntry, "project_name" | "project_color" | "entry_tags">),
                            ...extractProjectFields((data as unknown as Record<string, unknown>).projects),
                            entry_tags: entryTags,
                        }
                        : e
                )
            );
        }
    };

    return {
        loading,
        error,
        setError,
        entries,
        setEntries,
        loadEntries,
        projects,
        setProjects,
        tags,
        setTags,
        selectedProjectId,
        setSelectedProjectId,
        newProjectName,
        setNewProjectName,
        newProjectColor,
        setNewProjectColor,
        creatingProject,
        insertEntryTags,
        handleDeleteEntry,
        handleCreateProject,
        handleCreateTag,
        handleDeleteTag,
        handleUpdateTagColor,
        handleUpdateProjectTags,
        handleDeleteProject,
        handleUpdateProjectColor,
        handleSaveEditEntry,
    };
}
