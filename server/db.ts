import { customAlphabet } from "nanoid";
import type {
  Contribution,
  InsertContribution,
  InsertNotification,
  InsertProject,
  InsertSection,
  Notification,
  Project,
  Section,
  User,
  UserRole,
} from "@shared/types";
import { ENV } from "./_core/env";
import { supabaseAdmin } from "./_core/supabase";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 10);

type ProfileRow = {
  id: string;
  email: string | null;
  name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
  last_signed_in: string;
};

type ProjectRow = {
  id: number;
  creator_id: string;
  celebrant_name: string;
  birthday_date: string;
  cover_photo_url: string | null;
  welcome_message: string | null;
  spotify_url: string | null;
  status: "draft" | "published";
  public_url: string | null;
  created_at: string;
  updated_at: string;
};

type SectionRow = {
  id: number;
  project_id: number;
  type: Section["type"];
  display_order: number;
  content: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

type ContributionRow = {
  id: number;
  project_id: number;
  contributor_name: string;
  message: string;
  profile_photo_url: string | null;
  photo_with_celebrant_url: string | null;
  status: Contribution["status"];
  created_at: string;
  updated_at: string;
};

type NotificationRow = {
  id: number;
  creator_id: string;
  contribution_id: number | null;
  type: Notification["type"];
  content: string;
  read: boolean;
  created_at: string;
};

function fail(error: unknown): never {
  if (error instanceof Error) throw error;
  throw new Error(String(error));
}

function assertNoError(error: unknown) {
  if (error) fail(error);
}

function toIsoDate(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

function toUser(row: ProfileRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastSignedIn: row.last_signed_in,
  };
}

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    creatorId: row.creator_id,
    celebrantName: row.celebrant_name,
    birthdayDate: row.birthday_date,
    coverPhotoUrl: row.cover_photo_url,
    welcomeMessage: row.welcome_message,
    spotifyUrl: row.spotify_url,
    status: row.status,
    publicUrl: row.public_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toSection(row: SectionRow): Section {
  return {
    id: row.id,
    projectId: row.project_id,
    type: row.type,
    order: row.display_order,
    content: row.content,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toContribution(row: ContributionRow): Contribution {
  return {
    id: row.id,
    projectId: row.project_id,
    contributorName: row.contributor_name,
    message: row.message,
    profilePhotoUrl: row.profile_photo_url,
    photoWithCelebrantUrl: row.photo_with_celebrant_url,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    creatorId: row.creator_id,
    contributionId: row.contribution_id,
    type: row.type,
    content: row.content,
    read: row.read,
    createdAt: row.created_at,
  };
}

export async function upsertUser(user: {
  id: string;
  email?: string | null;
  name?: string | null;
}): Promise<User> {
  const role: UserRole =
    ENV.ownerEmail && user.email?.toLowerCase() === ENV.ownerEmail.toLowerCase()
      ? "admin"
      : "user";

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email ?? null,
        name: user.name ?? null,
        role,
        last_signed_in: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select("*")
    .single();

  assertNoError(error);
  return toUser(data as ProfileRow);
}

export async function getUserById(id: string) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  assertNoError(error);
  return data ? toUser(data as ProfileRow) : undefined;
}

export async function createProject(project: InsertProject) {
  const { data, error } = await supabaseAdmin
    .from("projects")
    .insert({
      creator_id: project.creatorId,
      celebrant_name: project.celebrantName,
      birthday_date: toIsoDate(project.birthdayDate),
      cover_photo_url: project.coverPhotoUrl ?? null,
      welcome_message: project.welcomeMessage ?? null,
      spotify_url: project.spotifyUrl ?? null,
      status: project.status ?? "draft",
      public_url: project.publicUrl ?? nanoid(),
    })
    .select("*")
    .single();

  assertNoError(error);
  return toProject(data as ProjectRow);
}

export async function getProjectById(id: number) {
  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  assertNoError(error);
  return data ? toProject(data as ProjectRow) : undefined;
}

export async function getProjectByPublicUrl(publicUrl: string) {
  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("*")
    .eq("public_url", publicUrl)
    .maybeSingle();

  assertNoError(error);
  return data ? toProject(data as ProjectRow) : undefined;
}

export async function getProjectsByCreatorId(creatorId: string) {
  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("*")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false });

  assertNoError(error);
  return ((data ?? []) as ProjectRow[]).map(toProject);
}

export async function updateProject(id: number, project: Partial<InsertProject>) {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (project.celebrantName !== undefined) payload.celebrant_name = project.celebrantName;
  if (project.birthdayDate !== undefined) payload.birthday_date = toIsoDate(project.birthdayDate);
  if (project.coverPhotoUrl !== undefined) payload.cover_photo_url = project.coverPhotoUrl ?? null;
  if (project.welcomeMessage !== undefined) payload.welcome_message = project.welcomeMessage ?? null;
  if (project.spotifyUrl !== undefined) payload.spotify_url = project.spotifyUrl ?? null;
  if (project.status !== undefined) payload.status = project.status;
  if (project.publicUrl !== undefined) payload.public_url = project.publicUrl;

  const { data, error } = await supabaseAdmin
    .from("projects")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  assertNoError(error);
  return toProject(data as ProjectRow);
}

export async function deleteProject(id: number) {
  const { error } = await supabaseAdmin.from("projects").delete().eq("id", id);
  assertNoError(error);
}

export async function createSection(section: InsertSection) {
  const { data, error } = await supabaseAdmin
    .from("sections")
    .insert({
      project_id: section.projectId,
      type: section.type,
      display_order: section.order,
      content: section.content ?? null,
      image_url: section.imageUrl ?? null,
    })
    .select("*")
    .single();

  assertNoError(error);
  return toSection(data as SectionRow);
}

export async function getSectionsByProjectId(projectId: number) {
  const { data, error } = await supabaseAdmin
    .from("sections")
    .select("*")
    .eq("project_id", projectId)
    .order("display_order", { ascending: true });

  assertNoError(error);
  return ((data ?? []) as SectionRow[]).map(toSection);
}

export async function updateSection(id: number, section: Partial<InsertSection>) {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (section.order !== undefined) payload.display_order = section.order;
  if (section.content !== undefined) payload.content = section.content ?? null;
  if (section.imageUrl !== undefined) payload.image_url = section.imageUrl ?? null;

  const { data, error } = await supabaseAdmin
    .from("sections")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  assertNoError(error);
  return toSection(data as SectionRow);
}

export async function deleteSection(id: number) {
  const { error } = await supabaseAdmin.from("sections").delete().eq("id", id);
  assertNoError(error);
}

export async function getSectionById(id: number) {
  const { data, error } = await supabaseAdmin
    .from("sections")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  assertNoError(error);
  return data ? toSection(data as SectionRow) : undefined;
}

export async function createContribution(contribution: InsertContribution) {
  const { data, error } = await supabaseAdmin
    .from("contributions")
    .insert({
      project_id: contribution.projectId,
      contributor_name: contribution.contributorName,
      message: contribution.message,
      profile_photo_url: contribution.profilePhotoUrl ?? null,
      photo_with_celebrant_url: contribution.photoWithCelebrantUrl ?? null,
      status: contribution.status ?? "pending",
    })
    .select("*")
    .single();

  assertNoError(error);
  return toContribution(data as ContributionRow);
}

export async function getContributionsByProjectId(projectId: number) {
  const { data, error } = await supabaseAdmin
    .from("contributions")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  assertNoError(error);
  return ((data ?? []) as ContributionRow[]).map(toContribution);
}

export async function getApprovedContributionsByProjectId(projectId: number) {
  const { data, error } = await supabaseAdmin
    .from("contributions")
    .select("*")
    .eq("project_id", projectId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  assertNoError(error);
  return ((data ?? []) as ContributionRow[]).map(toContribution);
}

export async function updateContribution(id: number, contribution: Partial<InsertContribution>) {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (contribution.contributorName !== undefined) payload.contributor_name = contribution.contributorName;
  if (contribution.message !== undefined) payload.message = contribution.message;
  if (contribution.profilePhotoUrl !== undefined) payload.profile_photo_url = contribution.profilePhotoUrl ?? null;
  if (contribution.photoWithCelebrantUrl !== undefined) {
    payload.photo_with_celebrant_url = contribution.photoWithCelebrantUrl ?? null;
  }
  if (contribution.status !== undefined) payload.status = contribution.status;

  const { data, error } = await supabaseAdmin
    .from("contributions")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  assertNoError(error);
  return toContribution(data as ContributionRow);
}

export async function deleteContribution(id: number) {
  const { error } = await supabaseAdmin.from("contributions").delete().eq("id", id);
  assertNoError(error);
}

export async function getContributionById(id: number) {
  const { data, error } = await supabaseAdmin
    .from("contributions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  assertNoError(error);
  return data ? toContribution(data as ContributionRow) : undefined;
}

export async function createNotification(notification: InsertNotification) {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .insert({
      creator_id: notification.creatorId,
      contribution_id: notification.contributionId ?? null,
      type: notification.type,
      content: notification.content,
      read: notification.read ?? false,
    })
    .select("*")
    .single();

  assertNoError(error);
  return toNotification(data as NotificationRow);
}

export async function getNotificationsByCreatorId(creatorId: string) {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .select("*")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false });

  assertNoError(error);
  return ((data ?? []) as NotificationRow[]).map(toNotification);
}

export async function markNotificationAsRead(id: number) {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .update({ read: true })
    .eq("id", id)
    .select("*")
    .single();

  assertNoError(error);
  return toNotification(data as NotificationRow);
}

export async function getNotificationById(id: number) {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  assertNoError(error);
  return data ? toNotification(data as NotificationRow) : undefined;
}
