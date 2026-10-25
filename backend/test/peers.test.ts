import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dimensions, hasResumeContent, parsePeerAnalysis, resumeSnapshot, skillOverlap } from "../src/peers";

describe("skillOverlap", () => {
  const skill = (name: string, embedding: number[], score = 80) => ({ name, embedding, score });

  it("is 1 for identical skills, lower for partial overlap, and null without skills", () => {
    const mine = [skill("Python", [1, 0, 0]), skill("SQL", [0, 1, 0])];
    assert.equal(skillOverlap(mine, mine), 1);
    const partial = skillOverlap(mine, [skill("Python", [1, 0, 0])])!;
    assert.ok(partial > 0.5 && partial < 1);
    assert.equal(skillOverlap(mine, [skill("Painting", [0, 0, 1])]), 0);
    assert.equal(skillOverlap([], mine), null);
  });
});

describe("resumeSnapshot", () => {
  it("keeps resume content and leaves out links, location and contact details", () => {
    const snapshot = resumeSnapshot("7", {
      headline: "CS student",
      summary: "Builds backends",
      location: "Columbus, OH",
      links: [{ label: "GitHub", url: "https://github.com/me" }],
      githubUsernames: ["me"],
      education: [{ institution: "OSU", degree: "BS", field: "CSE", startYear: 2023, endYear: 2027, description: "Systems II" }],
      jobs: [{ title: "Intern", company: "Acme", location: "Remote", startDate: "2025-05-01", endDate: null, description: "Built an ETL job" }],
      projects: [{ name: "Bus tracker", description: "Live map", url: "https://bus.example.com", skills: ["React", 3] }],
      skills: [{ name: "Python", level: "advanced" }],
    }, { fullName: "Sam Lee", institution: "OSU", email: "sam@example.com" });

    assert.equal(snapshot.name, "Sam Lee");
    assert.deepEqual(snapshot.education[0], { institution: "OSU", degree: "BS", field: "CSE", years: "2023–2027", description: "Systems II" });
    assert.deepEqual(snapshot.jobs[0], { title: "Intern", company: "Acme", dates: "2025-05 to present", description: "Built an ETL job" });
    assert.deepEqual(snapshot.projects[0], { name: "Bus tracker", description: "Live map", skills: ["React"] });
    const serialized = JSON.stringify(snapshot);
    for (const leaked of ["Columbus", "github.com", "sam@example.com", "bus.example.com", "Remote"]) {
      assert.equal(serialized.includes(leaked), false, `${leaked} should not be sent for analysis`);
    }
    assert.equal(hasResumeContent(snapshot), true);
    assert.equal(hasResumeContent(resumeSnapshot("8", { headline: "Only a headline" }, null)), false);
  });
});

describe("parsePeerAnalysis", () => {
  const growthItem = (skill: string) => ({ skill, why: "Core to the role.", concepts: ["B-tree indexes", "EXPLAIN ANALYZE", "  "], apply: "Add indexes to your bus tracker and measure query time." });
  const valid = {
    targetRole: "Backend software engineer intern",
    dimensions: [
      { key: "technical_depth", you: { level: 3, evidence: "Designed the bus tracker API." }, peer: { level: 2, evidence: "Used Flask in a class project." } },
      { key: "experience", you: { level: 1, evidence: "" }, peer: { level: 3, evidence: "Ten-week internship building ETL jobs." } },
      // A strong claim without evidence is downgraded to "minimal".
      { key: "impact", you: { level: 4, evidence: "" }, peer: { level: 9, evidence: "Cut report time 40%." } },
    ],
    peerEdges: [{ area: "Professional experience", detail: "A completed data engineering internship." }, { area: "", detail: "dropped" }],
    yourEdges: [{ area: "Project depth", detail: "Your API design is more substantial." }],
    growth: [growthItem("SQL query performance"), growthItem("Data modeling"), growthItem("Extra")],
    teamUp: { title: "Transit data pipeline", description: "Ingest bus GPS data into Postgres and serve it.", youBring: "API design", peerBrings: "ETL" },
  };

  it("fills every dimension, enforces evidence and decides leaders from levels", () => {
    const analysis = parsePeerAnalysis(valid);
    assert.deepEqual(analysis.dimensions.map((item) => item.key), dimensions.map((item) => item.key));
    const byKey = Object.fromEntries(analysis.dimensions.map((item) => [item.key, item]));
    assert.equal(byKey.technical_depth.leader, "you");
    assert.equal(byKey.experience.leader, "peer");
    assert.equal(byKey.impact.you.level, 1);
    assert.equal(byKey.impact.peer.level, 4);
    assert.equal(byKey.education.leader, "tie");
    assert.equal(byKey.education.you.evidence, "No evidence in the profile.");
  });

  it("keeps two growth steps and drops incomplete notes", () => {
    const analysis = parsePeerAnalysis(valid);
    assert.equal("skills" in analysis, false);
    assert.equal(analysis.growth.length, 2);
    assert.deepEqual(analysis.growth[0].concepts, ["B-tree indexes", "EXPLAIN ANALYZE"]);
    assert.equal(analysis.peerEdges.length, 1);
    assert.equal(analysis.teamUp.peerBrings, "ETL");
  });

  it("rejects analyses without two concrete growth steps or a team-up project", () => {
    assert.throws(() => parsePeerAnalysis({ ...valid, growth: [growthItem("Only one")] }), /incomplete/);
    assert.throws(() => parsePeerAnalysis({ ...valid, growth: [{ ...growthItem("a"), concepts: [] }, growthItem("b")] }), /incomplete/);
    assert.throws(() => parsePeerAnalysis({ ...valid, teamUp: {} }), /incomplete/);
    assert.throws(() => parsePeerAnalysis([]), /invalid/);
  });
});
