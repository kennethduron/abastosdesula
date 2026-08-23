import { createMockRepositories } from "@/data/adapters/mock";

const repositories = createMockRepositories();

export function getRepositories() {
  return repositories;
}
