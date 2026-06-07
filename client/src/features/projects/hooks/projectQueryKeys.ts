export const projectQueryKeys = {
  all: ["projects"] as const,
  lists: () => [...projectQueryKeys.all, "list"] as const
};