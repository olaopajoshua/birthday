/**
 * Unified type exports.
 * These types mirror the Supabase schema in supabase/migrations.
 */

export type UserRole = "user" | "admin";
export type ProjectStatus = "draft" | "published";
export type SectionType = "welcome" | "story" | "gallery" | "wishes" | "closing";
export type ContributionStatus = "pending" | "approved" | "rejected";
export type NotificationType = "new_contribution";

export type User = {
  id: string;
  email: string | null;
  name: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  lastSignedIn: string;
};

export type Project = {
  id: number;
  creatorId: string;
  celebrantName: string;
  birthdayDate: string;
  coverPhotoUrl: string | null;
  welcomeMessage: string | null;
  spotifyUrl: string | null;
  status: ProjectStatus;
  publicUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InsertProject = {
  creatorId: string;
  celebrantName: string;
  birthdayDate: Date | string;
  coverPhotoUrl?: string | null;
  welcomeMessage?: string | null;
  spotifyUrl?: string | null;
  status?: ProjectStatus;
  publicUrl?: string | null;
};

export type Section = {
  id: number;
  projectId: number;
  type: SectionType;
  order: number;
  content: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InsertSection = {
  projectId: number;
  type: SectionType;
  order: number;
  content?: string | null;
  imageUrl?: string | null;
};

export type Contribution = {
  id: number;
  projectId: number;
  contributorName: string;
  message: string;
  profilePhotoUrl: string | null;
  photoWithCelebrantUrl: string | null;
  status: ContributionStatus;
  createdAt: string;
  updatedAt: string;
};

export type InsertContribution = {
  projectId: number;
  contributorName: string;
  message: string;
  profilePhotoUrl?: string | null;
  photoWithCelebrantUrl?: string | null;
  status?: ContributionStatus;
};

export type Notification = {
  id: number;
  creatorId: string;
  contributionId: number | null;
  type: NotificationType;
  content: string;
  read: boolean;
  createdAt: string;
};

export type InsertNotification = {
  creatorId: string;
  contributionId?: number | null;
  type: NotificationType;
  content: string;
  read?: boolean;
};

export * from "./_core/errors";
