import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { createProject, getProjectsByCreatorId, getProjectById, updateProject, deleteProject, createSection, getSectionsByProjectId, updateSection, deleteSection, getSectionById, createContribution, getContributionsByProjectId, updateContribution, deleteContribution, getContributionById, createNotification, getNotificationsByCreatorId, markNotificationAsRead, getNotificationById, getProjectByPublicUrl, getUserById } from "./db";
import { getSignedUploadUrl, storagePut } from "./storage";
import { sendEmail } from "./utils";
import { invokeLLM } from "./_core/llm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { Express } from "express";
import multer from "multer";

// In-memory multer storage
const memoryStorage = multer.memoryStorage();

// ---- Express upload routes (public, server-side storagePut) ----
export function registerUploadRoutes(app: Express) {
  const upload = multer({
    storage: memoryStorage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  });

  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: "No file provided" });
        return;
      }

      const projectId = req.body.projectId || "general";
      const timestamp = Date.now();
      const ext = file.mimetype.includes("png") ? "png"
        : file.mimetype.includes("jpeg") || file.mimetype.includes("jpg") ? "jpg"
        : file.mimetype.includes("webp") ? "webp"
        : "bin";
      const key = `projects/${projectId}/${timestamp}-${crypto.randomUUID()}.${ext}`;
      const { url } = await storagePut(key, file.buffer, file.mimetype);
      res.json({ url, key });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  app.post("/api/upload/contribution", upload.single("file"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: "No file provided" });
        return;
      }

      const ext = file.mimetype.includes("png") ? "png"
        : file.mimetype.includes("jpeg") || file.mimetype.includes("jpg") ? "jpg"
        : file.mimetype.includes("webp") ? "webp"
        : "bin";
      const key = `contributions/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const { url } = await storagePut(key, file.buffer, file.mimetype);
      res.json({ url, key });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(() => {
      return {
        success: true,
      } as const;
    }),
  }),
  projects: router({
    getSignedUploadUrl: protectedProcedure.input(z.object({
      fileName: z.string(),
      fileType: z.string(),
      projectId: z.number().optional(),
      contributionId: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { fileName, fileType, projectId, contributionId } = input;
      let key: string;

      if (projectId) {
        const projectForUpload = await getProjectById(projectId);
        if (!projectForUpload || projectForUpload.creatorId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to upload for this project' });
        }
        key = `projects/${projectId}/${fileName}`;
      } else if (contributionId) {
        key = `contributions/${contributionId}/${fileName}`;
      } else {
        key = `general/${ctx.user.id}/${fileName}`;
      }

      const url = await getSignedUploadUrl(key, fileType);
      return url;
    }),
    create: protectedProcedure.input(z.object({
      celebrantName: z.string().min(1),
      birthdayDate: z.date(),
      coverPhotoUrl: z.string().optional(),
      welcomeMessage: z.string().optional(),
      spotifyUrl: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const newProject = await createProject({ ...input, creatorId: ctx.user.id });
      return newProject;
    }),
    list: protectedProcedure.query(async ({ ctx }) => {
      const projects = await getProjectsByCreatorId(ctx.user.id);
      return projects;
    }),
    get: publicProcedure.input(z.object({
      id: z.number().optional(),
      publicUrl: z.string().optional(),
    })).query(async ({ input }) => {
      if (input.id) {
        const projectById = await getProjectById(input.id);
        return projectById;
      } else if (input.publicUrl) {
        const projectByPublicUrl = await getProjectByPublicUrl(input.publicUrl);
        return projectByPublicUrl;
      }
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Either projectId or publicUrl must be provided' });
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      celebrantName: z.string().min(1).optional(),
      birthdayDate: z.date().optional(),
      coverPhotoUrl: z.string().optional(),
      welcomeMessage: z.string().optional(),
      spotifyUrl: z.string().optional(),
      status: z.enum(["draft", "published"]).optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const projectToUpdate = await getProjectById(id);
      if (!projectToUpdate || projectToUpdate.creatorId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to update this project' });
      }
      const updatedProject = await updateProject(id, data);
      return updatedProject;
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const projectToDelete = await getProjectById(input.id);
      if (!projectToDelete || projectToDelete.creatorId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to delete this project' });
      }
      await deleteProject(input.id);
      return { success: true };
    }),
  }),
  sections: router({
    create: protectedProcedure.input(z.object({
      projectId: z.number(),
      type: z.enum(["welcome", "story", "gallery", "wishes", "closing"]),
      order: z.number(),
      content: z.string().optional(),
      imageUrl: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const projectForSectionCreate = await getProjectById(input.projectId);
      if (!projectForSectionCreate || projectForSectionCreate.creatorId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to add sections to this project' });
      }
      const section = await createSection(input);
      return section;
    }),
    list: publicProcedure.input(z.object({ projectId: z.number() })).query(async ({ input }) => {
      const sections = await getSectionsByProjectId(input.projectId);
      return sections;
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      order: z.number().optional(),
      content: z.string().optional(),
      imageUrl: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const sectionToUpdate = await getSectionById(id);
      if (!sectionToUpdate) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Section not found' });
      }
      const projectForSectionUpdate = await getProjectById(sectionToUpdate.projectId);
      if (!projectForSectionUpdate || projectForSectionUpdate.creatorId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to update sections for this project' });
      }
      const section = await updateSection(id, data);
      return section;
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const sectionToDelete = await getSectionById(input.id);
      if (!sectionToDelete) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Section not found' });
      }
      const projectForSection = await getProjectById(sectionToDelete.projectId);
      if (!projectForSection || projectForSection.creatorId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to delete sections from this project' });
      }
      await deleteSection(input.id);
      return { success: true };
    }),
  }),
  contributions: router({
    create: publicProcedure.input(z.object({
      projectId: z.number(),
      contributorName: z.string().min(1),
      message: z.string().min(1),
      profilePhotoUrl: z.string().optional(),
      photoWithCelebrantUrl: z.string().optional(),
    })).mutation(async ({ input }) => {
      const contribution = await createContribution(input);
      
      // Fetch project and creator details to send email
      const projectForContribution = await getProjectById(input.projectId);
      if (projectForContribution) {
        const creator = await getUserById(projectForContribution.creatorId);
        if (creator?.email) {
            const subject = `New Birthday Wish for ${projectForContribution.celebrantName}!`;
            const htmlBody = `
              <h2>You have a new contribution!</h2>
              <p><strong>${input.contributorName}</strong> just left a birthday wish for ${projectForContribution.celebrantName}.</p>
              <blockquote>"${input.message}"</blockquote>
              <p>Log in to your dashboard to review and approve it.</p>
            `;
            
            sendEmail(creator.email, subject, htmlBody).catch(err => {
              console.error("Failed to send notification email:", err);
            });
            
            await createNotification({
              creatorId: creator.id,
              type: "new_contribution",
              content: `${input.contributorName} left a new wish for ${projectForContribution.celebrantName}.`,
              contributionId: contribution.id,
            });
        }
      }
      
      return contribution;
    }),
    list: protectedProcedure.input(z.object({ projectId: z.number() })).query(async ({ ctx, input }) => {
      const projectForContributionList = await getProjectById(input.projectId);
      if (!projectForContributionList || projectForContributionList.creatorId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to view contributions for this project' });
      }
      const contributions = await getContributionsByProjectId(input.projectId);
      return contributions;
    }),
    updateStatus: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["pending", "approved", "rejected"]),
    })).mutation(async ({ ctx, input }) => {
      const { id, status } = input;
      const contributionToUpdate = await getContributionById(id);
      if (!contributionToUpdate) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Contribution not found' });
      }
      const projectForContributionUpdate = await getProjectById(contributionToUpdate.projectId);
      if (!projectForContributionUpdate || projectForContributionUpdate.creatorId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to update this contribution' });
      }
      const contribution = await updateContribution(id, { status });
      return contribution;
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const contributionToDelete = await getContributionById(input.id);
      if (!contributionToDelete) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Contribution not found' });
      }
      const projectForContribution = await getProjectById(contributionToDelete.projectId);
      if (!projectForContribution || projectForContribution.creatorId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to delete this contribution' });
      }
      await deleteContribution(input.id);
      return { success: true };
    }),
  }),
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const userNotifications = await getNotificationsByCreatorId(ctx.user.id);
      return userNotifications;
    }),
    markAsRead: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const notificationToUpdate = await getNotificationById(input.id);
      if (!notificationToUpdate) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Notification not found' });
      }
      if (notificationToUpdate.creatorId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to mark this notification as read' });
      }
      const updatedNotification = await markNotificationAsRead(input.id);
      return updatedNotification;
    }),
  }),
  // AI-powered suggestions
  ai: router({
    suggestMessage: protectedProcedure.input(z.object({
      context: z.string().min(1),
    })).mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a birthday message generator. Generate 3 short, warm, and creative welcome messages for a birthday keepsake website. Each should be 1-3 sentences. Return them as a JSON array of strings." },
          { role: "user", content: input.context },
        ],
        response_format: {
          type: "json_object",
        },
      });
      
      let suggestions: string[] = [];
      try {
        const parsed = JSON.parse(response.choices[0].message.content as string);
        if (Array.isArray(parsed.suggestions)) {
          suggestions = parsed.suggestions.slice(0, 3);
        } else if (Array.isArray(parsed.messages)) {
          suggestions = parsed.messages.slice(0, 3);
        } else if (typeof parsed === "object") {
          suggestions = Object.values(parsed).slice(0, 3).map(String);
        }
      } catch {
        const content = response.choices[0].message.content as string;
        suggestions = content.split("\n").filter(s => s.trim()).slice(0, 3);
      }
      
      return { suggestions };
    }),
    suggestContributionMessage: publicProcedure.input(z.object({
      context: z.string().min(1),
      celebrantName: z.string().min(1),
    })).mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: `You are a birthday wish generator. Generate 3 short, warm, and creative birthday wishes for ${input.celebrantName}. Each should be 1-3 sentences. Consider the relationship context provided by the user. Return them as a JSON array of strings.` },
          { role: "user", content: input.context },
        ],
        response_format: {
          type: "json_object",
        },
      });
      
      let suggestions: string[] = [];
      try {
        const parsed = JSON.parse(response.choices[0].message.content as string);
        if (Array.isArray(parsed.suggestions)) {
          suggestions = parsed.suggestions.slice(0, 3);
        } else if (Array.isArray(parsed.messages)) {
          suggestions = parsed.messages.slice(0, 3);
        } else if (typeof parsed === "object") {
          suggestions = Object.values(parsed).slice(0, 3).map(String);
        }
      } catch {
        const content = response.choices[0].message.content as string;
        suggestions = content.split("\n").filter(s => s.trim()).slice(0, 3);
      }
      
      return { suggestions };
    }),
  }),
});

export type AppRouter = typeof appRouter;
