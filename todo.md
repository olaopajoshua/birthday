# Birthday Keepsake - Project TODO

## Phase 1: Database Schema & Backend Setup
- [x] Create database tables: projects, sections, contributions, notifications
- [x] Set up S3 storage helpers for photo uploads
- [x] Create tRPC procedures for project CRUD operations
- [x] Create tRPC procedures for contribution management
- [x] Create tRPC procedures for publishing/unpublishing projects
- [x] Implement S3-backed upload logic and integrate with frontend for cover photo, profile photo, and optional contributor photo uploads
- [x] Finish contribution moderation authorization checks so only the owning creator can approve/reject/delete submissions
- [x] Add explicit publish/unpublish tRPC mutations with ownership checks and public visibility rules
- [x] Set up email notification system on contribution submission
- [x] Fix variable redeclaration issues in server/routers.ts
- [ ] Write vitest tests for backend procedures

## Phase 2: Frontend - Landing Page & Auth (CURRENT)
- [x] Design and implement the landing page with hero section, feature highlights, and CTA
- [x] Implement user authentication flow and login/logout functionality
- [x] Create responsive navigation bar with logo and CTA buttons
- [x] Add footer with links and branding

## Phase 3: Frontend - Creator Dashboard & Project Editor
- [x] Design and implement the creator dashboard to manage projects
- [x] Implement create new project functionality
- [x] Implement birthday project editor (celebrant name, date, cover photo, welcome message)
- [x] Add project deletion with confirmation
- [x] Create public URL generator and sharing interface
- [x] Implement section management (add/edit/delete/order sections)

## Phase 4: Frontend - Contributor Flow & Moderation
- [x] Implement shareable contributor link and submission form (wish, message, photo)
- [x] Implement submission moderation panel for creators
- [x] Add AI-powered message suggestion feature
- [x] Add AI-powered welcome message suggestion feature
- [x] Create contributions list view for creators
- [x] Implement approve/reject/delete actions

## Phase 5: Frontend - Published Birthday Website
- [x] Design and implement the published birthday website layout
- [x] Display approved wishes and photos on the published site
- [x] Build celebrant profile section
- [x] Implement sections rendering (welcome, story, gallery, wishes, closing)
- [x] Add photo gallery view with section-based gallery support
- [x] Add Spotify song integration (add song in Editor, embed player in View)
- [x] Implement sharing buttons and social media integration
- [x] Split published site (final/read-only) from contribution site (separate /contribute/ link)
- [x] Remove "Add Your Wish" CTA from published View page
- [x] Add confetti animation to published site

## Phase 6: UI Polish & Refinement
- [x] Add page transition animations to all pages
- [x] Implement button hover/active states globally
- [x] Refine typography: font sizes, line heights, and spacing
- [x] Test mobile breakpoints on landing and dashboard
- [x] Test mobile breakpoints on editor, contribution, moderation, and published pages
- [x] Add ARIA labels to Home and Dashboard
- [ ] Add accessibility attributes to Editor, Contribute, View, and Moderation pages
- [ ] Verify keyboard navigation and focus states across all pages
- [ ] Review and fix color contrast issues

## Phase 7: Testing & Delivery
- [ ] Conduct end-to-end testing of all features and user flows
- [ ] Test complete user journey (creator)
- [ ] Test complete user journey (contributor)
- [ ] Deliver the live website to the user
