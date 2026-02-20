import { z } from "zod";

const gistResponseSchema = z.object({
  id: z.string(),
  html_url: z.url(),
  public: z.boolean(),
  description: z.string().nullable(),
  updated_at: z.iso.datetime(),
  owner: z.object({
    id: z.number(),
    login: z.string(),
  }),
  fork_of: z.unknown().nullable().optional(),
  history: z
    .array(
      z.object({
        version: z.string(),
      }),
    )
    .min(1),
});

export type OwnedGist = {
  gistId: string;
  gistUrl: string;
  ownerId: string;
  ownerLogin: string;
  description: string | null;
  version: string;
  updatedAt: Date;
};

export function parseGistIdFromUrl(rawUrl: string): string | null {
  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  if (url.hostname !== "gist.github.com") {
    return null;
  }

  const segments = url.pathname
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  if (segments.length === 0) {
    return null;
  }

  const gistCandidate = segments[segments.length - 1];

  if (!/^[a-f0-9]{8,}$/i.test(gistCandidate)) {
    return null;
  }

  return gistCandidate.toLowerCase();
}

export async function verifyOwnedPublicGist(input: {
  gistUrl: string;
  expectedOwnerGithubId: string;
}): Promise<OwnedGist> {
  const gistId = parseGistIdFromUrl(input.gistUrl);

  if (!gistId) {
    throw new Error("Invalid gist URL. Expected https://gist.github.com/<user>/<id>");
  }

  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(process.env.GITHUB_API_TOKEN
        ? { Authorization: `Bearer ${process.env.GITHUB_API_TOKEN}` }
        : {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Gist not found.");
    }

    throw new Error(`GitHub API error: ${response.status}`);
  }

  const gistJson = await response.json();
  const gist = gistResponseSchema.parse(gistJson);

  if (!gist.public) {
    throw new Error("Gist must be public.");
  }

  if (gist.fork_of) {
    throw new Error("Forked gists are not allowed.");
  }

  if (String(gist.owner.id) !== input.expectedOwnerGithubId) {
    throw new Error("Gist owner does not match your GitHub account.");
  }

  return {
    gistId: gist.id,
    gistUrl: gist.html_url,
    ownerId: String(gist.owner.id),
    ownerLogin: gist.owner.login,
    description: gist.description,
    version: gist.history[0].version,
    updatedAt: new Date(gist.updated_at),
  };
}
