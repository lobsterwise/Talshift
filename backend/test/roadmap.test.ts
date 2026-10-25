import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { gapRequirements, parseRoadmapPlan, projectedPercent, qualificationMatch, requirementCredit } from "../src/roadmap";

const docker = [1, 0, 0];
const python = [0, 1, 0];
const sql = [0, 0, 1];

describe("requirementCredit", () => {
  it("gives nothing for loosely related wording and full credit for close matches", () => {
    assert.equal(requirementCredit(0.4, 1), 0);
    assert.equal(requirementCredit(0.75, 1), 1);
    assert.ok(Math.abs(requirementCredit(0.6, 1) - 0.5) < 1e-9);
    // Scaled by how strongly the resume evidences the skill.
    assert.equal(requirementCredit(1, 0.7), 0.7);
  });
});

describe("qualificationMatch", () => {
  const requirements = [
    { name: "Docker", weight: 100, embedding: docker },
    { name: "Python", weight: 50, embedding: python },
    { name: "SQL", weight: 50, embedding: sql },
  ];

  it("weights coverage by requirement priority and skill evidence", () => {
    const match = qualificationMatch(requirements, [{ name: "Python", weight: 0.8, embedding: python }]);
    assert.equal(match.percent, 20);
    assert.deepEqual(match.requirements.map((item) => [item.name, item.status, item.bestSkill]), [
      ["Docker", "missing", null],
      ["Python", "covered", "Python"],
      ["SQL", "missing", null],
    ]);
  });

  it("orders gaps by priority times missing coverage and projects the milestone with the same formula", () => {
    const match = qualificationMatch(requirements, [{ name: "Python", weight: 0.8, embedding: python }]);
    assert.deepEqual(gapRequirements(match).map((item) => item.name), ["Docker", "SQL"]);
    assert.equal(projectedPercent(match, ["Docker"], "applied"), 60);
    assert.equal(projectedPercent(match, ["docker"], "used"), 53);
    // Completing something already covered never lowers it.
    assert.equal(projectedPercent(match, ["Python"], "used"), 20);
  });
});

describe("parseRoadmapPlan", () => {
  const valid = {
    weekend: {
      microProject: { title: "Containerize WorBots", skill: "Docker", steps: ["Write a multi-stage Dockerfile", "Run it with Compose and Postgres"], doneWhen: "docker compose up serves the app" },
      event: { kind: "Student hackathon", why: "Practice shipping fast", howToFind: "Check your university's events calendar and Major League Hacking" },
    },
    week: {
      networking: { action: "Request a review with Sam on your API design", why: "Sam works on backend systems" },
      interviewPrep: { focus: "Graphs and SQL joins", plan: ["10 medium graph problems"] },
    },
    month: {
      milestone: { title: "Team data pipeline", description: "Build an ETL pipeline with a teammate", teamProject: true, fills: ["Docker", "Made-up requirement", "sql"], level: "applied", doneWhen: "Pipeline runs nightly in CI" },
    },
  };

  it("resolves gap ids to the real requirement names", () => {
    const plan = parseRoadmapPlan({ ...valid, weekend: { ...valid.weekend, microProject: { ...valid.weekend.microProject, skill: "G2" } },
      month: { milestone: { ...valid.month.milestone, fills: ["G1", "g2", "G9"] } } }, ["Production AI/ML Software Engineering Experience", "SQL"], false);
    assert.deepEqual(plan.month.milestone.fills, ["Production AI/ML Software Engineering Experience", "SQL"]);
    assert.equal(plan.weekend.microProject.skill, "SQL");
  });

  it("keeps only requirements from the real gap list and drops interview prep when not ready", () => {
    const plan = parseRoadmapPlan(valid, ["Docker", "SQL"], false);
    assert.deepEqual(plan.month.milestone.fills, ["Docker", "SQL"]);
    assert.equal(plan.week.interviewPrep, null);
    assert.equal(plan.month.milestone.teamProject, true);
    assert.equal(parseRoadmapPlan(valid, ["Docker", "SQL"], true).week.interviewPrep?.focus, "Graphs and SQL joins");
  });

  it("rejects plans whose milestone fills no real gap or that miss required steps", () => {
    assert.throws(() => parseRoadmapPlan({ ...valid, month: { milestone: { ...valid.month.milestone, fills: ["Made-up"] } } }, ["Docker"], false), /incomplete/);
    assert.throws(() => parseRoadmapPlan({ ...valid, weekend: { ...valid.weekend, event: {} } }, ["Docker"], false), /incomplete/);
    assert.throws(() => parseRoadmapPlan(null, ["Docker"], false), /invalid/);
    // With no gaps left, a milestone does not need to fill one.
    assert.deepEqual(parseRoadmapPlan({ ...valid, month: { milestone: { ...valid.month.milestone, fills: [] } } }, [], false).month.milestone.fills, []);
  });
});
