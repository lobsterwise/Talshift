import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  describeEvidence,
  handleList,
  normalizeCredibilityReport,
  matchRepository,
  parseCredibilityNotes,
  parseGithubRepoUrl,
  parseGithubUsername,
  scoreProject,
  uniqueUsernames,
  type RepositoryEvidence,
} from "../src/credibility";

const project = { name: "Campus Bus Tracker", description: "Live bus map", url: "", skills: ["TypeScript", "React"] };

const repository: RepositoryEvidence = {
  fullName: "octocat/campus-bus-tracker",
  url: "https://github.com/octocat/campus-bus-tracker",
  description: "Live bus map",
  ownedByStudent: true,
  isFork: false,
  parentFullName: null,
  languages: ["TypeScript", "CSS"],
  commitCount: 40,
  commitAuthors: ["octocat"],
  activeDays: 14,
  firstCommitAt: "2026-02-01T10:00:00Z",
  lastCommitAt: "2026-04-15T10:00:00Z",
};

describe("GitHub input parsing", () => {
  it("accepts usernames, handles and profile or repository links", () => {
    assert.equal(parseGithubUsername("octocat"), "octocat");
    assert.equal(parseGithubUsername("@octocat"), "octocat");
    assert.equal(parseGithubUsername("https://github.com/octocat"), "octocat");
    assert.equal(parseGithubUsername("github.com/octocat/hello-world"), "octocat");
    assert.equal(parseGithubUsername("https://gitlab.com/octocat"), null);
    assert.equal(parseGithubUsername("not a user!"), null);
    assert.equal(parseGithubUsername(""), null);
  });

  it("reads owner and repository from repository links", () => {
    assert.deepEqual(parseGithubRepoUrl("https://github.com/octocat/hello-world.git"), { owner: "octocat", repo: "hello-world" });
    assert.deepEqual(parseGithubRepoUrl("https://www.github.com/octocat/hello-world/tree/main/src"), { owner: "octocat", repo: "hello-world" });
    assert.equal(parseGithubRepoUrl("https://github.com/octocat"), null);
    assert.equal(parseGithubRepoUrl("https://example.com/octocat/hello-world"), null);
  });
});

describe("matchRepository", () => {
  it("matches by name, homepage or shared tokens and ignores unrelated repositories", () => {
    const repositories = [
      { name: "dotfiles", homepage: null },
      { name: "campus-bus-tracker", homepage: null },
      { name: "portfolio", homepage: "https://bus.example.com/" },
    ];
    assert.equal(matchRepository(project, repositories)?.name, "campus-bus-tracker");
    assert.equal(matchRepository({ ...project, name: "Bus app", url: "https://bus.example.com" }, repositories)?.name, "portfolio");
    assert.equal(matchRepository({ ...project, name: "Chess engine" }, repositories), null);
  });

  it("prefers a repository name containing the project name over one contained in it", () => {
    const repositories = [{ name: "react" }, { name: "overreacted.io" }];
    assert.equal(matchRepository({ ...project, name: "Overreacted" }, repositories)?.name, "overreacted.io");
  });

  it("matches contributed repositories only on clear name matches in strict mode", () => {
    const contributed = [{ name: "react" }, { name: "campus-bus-tracker-api" }];
    assert.equal(matchRepository({ ...project, name: "React Dashboard" }, contributed), contributed[0]);
    assert.equal(matchRepository({ ...project, name: "React Dashboard" }, contributed, { strict: true }), null);
    assert.equal(matchRepository(project, contributed, { strict: true })?.name, "campus-bus-tracker-api");
    assert.equal(matchRepository({ ...project, name: "Bus tracker" }, [{ name: "bus-tracker-api" }], { strict: true })?.name, "bus-tracker-api");
  });
});

describe("scoreProject", () => {
  it("verifies sustained, matching commit history", () => {
    assert.deepEqual(scoreProject(project, repository, 90), { score: 98, status: "verified" });
  });

  it("does not verify missing repositories, thin history, or forks without own commits", () => {
    assert.deepEqual(scoreProject(project, null, 100), { score: 0, status: "unverified" });
    assert.equal(scoreProject(project, { ...repository, commitCount: 2, activeDays: 1 }, 90).status, "unverified");
    const fork = scoreProject(project, { ...repository, isFork: true, commitCount: 0, activeDays: 0 }, 90);
    assert.equal(fork.status, "unverified");
    assert.ok(fork.score <= 15);
  });

  it("does not verify history that the AI finds unrelated to the resume claim", () => {
    assert.equal(scoreProject(project, repository, 20).status, "unverified");
  });
});

describe("describeEvidence", () => {
  it("summarizes commits, forks and language overlap", () => {
    assert.deepEqual(describeEvidence({ ...project, skills: ["Python"] }, { ...repository, isFork: true, parentFullName: "city/buses" }, ["octocat"]), [
      "40 commits by @octocat across 14 active days from Feb 2026 to Apr 2026.",
      "Fork of city/buses; only the student's own commits are counted.",
      "Languages: TypeScript, CSS (none listed in the project's skills).",
    ]);
  });
});

describe("multiple GitHub accounts", () => {
  it("deduplicates accounts case-insensitively and drops empty values", () => {
    assert.deepEqual(uniqueUsernames(["octocat", null, "OctoCat", "monalisa", ""]), ["octocat", "monalisa"]);
  });

  it("names every account in findings", () => {
    assert.equal(handleList(["a"]), "@a");
    assert.equal(handleList(["a", "b", "c"]), "@a, @b or @c");
    assert.deepEqual(
      describeEvidence(project, { ...repository, commitAuthors: ["octocat", "octo-school"] }, ["octocat", "octo-school"])[0],
      "40 commits by @octocat and @octo-school across 14 active days from Feb 2026 to Apr 2026.",
    );
    assert.equal(
      describeEvidence(project, { ...repository, commitCount: 0, commitAuthors: [] }, ["octocat", "octo-school"])[0],
      "No commits authored by @octocat or @octo-school in octocat/campus-bus-tracker.",
    );
  });
});

describe("normalizeCredibilityReport", () => {
  it("upgrades reports saved with a single githubUsername", () => {
    const { commitAuthors, ownedByStudent: _owned, ...legacyRepository } = repository;
    const legacy = {
      githubUsername: "octocat",
      projects: [{ projectName: "Bus", score: 90, status: "verified", repository: legacyRepository, findings: ["x"], reviewerNote: null, reviewerQuestion: null }],
      generatedAt: "2026-10-25T00:00:00Z",
      model: "gemini-3.8-flash",
    } as unknown as Parameters<typeof normalizeCredibilityReport>[0];
    const report = normalizeCredibilityReport(legacy)!;
    assert.deepEqual(report.githubUsernames, ["octocat"]);
    assert.deepEqual(report.unavailableAccounts, []);
    assert.deepEqual(report.projects[0].repository?.commitAuthors, commitAuthors);
    assert.equal(report.projects[0].repository?.ownedByStudent, true);
    assert.equal("githubUsername" in report, false);
    assert.equal(normalizeCredibilityReport(null), null);
  });
});

describe("contributed repositories", () => {
  it("labels repositories the student does not own", () => {
    const findings = describeEvidence(project, { ...repository, fullName: "city/buses", ownedByStudent: false }, ["octocat"]);
    assert.equal(findings[1], "Contributed to city/buses, owned by @city; only the student's own commits are counted.");
  });
});

describe("parseCredibilityNotes", () => {
  it("places notes by index, bounds alignment and ignores invalid items", () => {
    assert.deepEqual(parseCredibilityNotes([
      { index: 1, alignment: 140, reviewerNote: " Private repo. ", reviewerQuestion: "How did you cache routes?" },
      { index: 7, alignment: 50 },
      "bad",
    ], 2), [
      { alignment: 0, reviewerNote: "", reviewerQuestion: "" },
      { alignment: 100, reviewerNote: "Private repo.", reviewerQuestion: "How did you cache routes?" },
    ]);
  });

  it("rejects a response that is not a list", () => {
    assert.throws(() => parseCredibilityNotes({}, 1), /invalid credibility notes/i);
  });
});
