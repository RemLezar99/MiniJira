export type ProjectRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export type ProjectOwner = {
  id: string;
  email: string;
  displayName: string;
};

export type ProjectMembership = {
  userId: string;
  projectId: string;
  role: ProjectRole;
  joinedAt: string;
};

export type Project = {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  owner: ProjectOwner;
  members: ProjectMembership[];
};

export type ProjectDetails = {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  owner: ProjectOwner;
  currentUserRole: ProjectRole;
  currentUserMembership: ProjectMembership;
};

export type ProjectsResponse = {
  projects: Project[];
};

export type ProjectResponse = {
  project: Project;
};

export type ProjectDetailsResponse = {
  project: ProjectDetails;
};

export type CreateProjectInput = {
  name: string;
  description?: string;
};

export type UpdateProjectInput = {
  name?: string;
  description?: string;
};