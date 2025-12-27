import type { Tree } from "../../../types/skills";

const KEY = "skillTree";

export function saveTree(tree: Tree) {
  localStorage.setItem(KEY, JSON.stringify(tree));
}

export function loadTree(): Tree | null {
  const data = localStorage.getItem(KEY);
  if(!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}