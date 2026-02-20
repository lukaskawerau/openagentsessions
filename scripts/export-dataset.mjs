import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["error"],
});

function sha256(content) {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

function byteSize(content) {
  return new TextEncoder().encode(content).length;
}

function makeSnapshotId(date) {
  return date.toISOString().replace(/[:.]/g, "-");
}

async function writeTextFile(filePath, content) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf8");
}

async function writeDatasetFiles(targetDir, files) {
  await Promise.all(
    Object.entries(files).map(([relativePath, content]) =>
      writeTextFile(path.join(targetDir, relativePath), content),
    ),
  );
}

async function main() {
  const generatedAt = new Date();
  const outputRoot = path.resolve(process.cwd(), process.env.DATASET_OUTPUT_DIR ?? ".dataset");
  const snapshotId = makeSnapshotId(generatedAt);

  const latestDir = path.join(outputRoot, "latest");
  const snapshotRelativeDir = path.join("snapshots", snapshotId);
  const snapshotDir = path.join(outputRoot, snapshotRelativeDir);

  const submissions = await prisma.submission.findMany({
    where: {
      state: "APPROVED",
      isAvailable: true,
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      gistId: true,
      gistUrl: true,
      gistOwnerId: true,
      gistOwnerLogin: true,
      gistVersion: true,
      gistUpdatedAt: true,
      createdAt: true,
      updatedAt: true,
      lastModeratedAt: true,
    },
  });

  const records = submissions.map((submission) => ({
    gist_id: submission.gistId,
    gist_url: submission.gistUrl,
    gist_owner_id: submission.gistOwnerId,
    gist_owner_login: submission.gistOwnerLogin,
    gist_version: submission.gistVersion,
    gist_updated_at: submission.gistUpdatedAt.toISOString(),
    submitted_at: submission.createdAt.toISOString(),
    approved_at: (submission.lastModeratedAt ?? submission.updatedAt).toISOString(),
    source: "github_gist",
    license: "CC0-1.0",
  }));

  const urlsContent = records.map((record) => record.gist_url).join("\n");
  const ndjsonContent = records.map((record) => JSON.stringify(record)).join("\n");

  const checksums = {
    "urls.txt": sha256(urlsContent),
    "submissions.ndjson": sha256(ndjsonContent),
  };

  const bytes = {
    "urls.txt": byteSize(urlsContent),
    "submissions.ndjson": byteSize(ndjsonContent),
  };

  const manifest = {
    generated_at: generatedAt.toISOString(),
    record_count: records.length,
    latest_dir: "latest",
    snapshot_dir: snapshotRelativeDir,
    files: {
      "urls.txt": {
        sha256: checksums["urls.txt"],
        bytes: bytes["urls.txt"],
      },
      "submissions.ndjson": {
        sha256: checksums["submissions.ndjson"],
        bytes: bytes["submissions.ndjson"],
      },
    },
  };

  const files = {
    "urls.txt": urlsContent,
    "submissions.ndjson": ndjsonContent,
    "manifest.json": `${JSON.stringify(manifest, null, 2)}\n`,
  };

  await writeDatasetFiles(snapshotDir, files);
  await writeDatasetFiles(latestDir, files);

  console.log(`dataset export complete`);
  console.log(`- records: ${records.length}`);
  console.log(`- latest: ${latestDir}`);
  console.log(`- snapshot: ${snapshotDir}`);
}

main()
  .catch((error) => {
    console.error("dataset export failed");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
