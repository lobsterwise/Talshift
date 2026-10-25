import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseProfessionalAttributes } from "../src/professionalSearch";

describe("parseProfessionalAttributes", () => {
  it("deduplicates names and bounds priorities without creating score fields", () => {
    const attributes = parseProfessionalAttributes([
      { name: "  Data   modeling ", priority: 72.4, evidence: "Required for the role" },
      { name: "data modeling", priority: 101, evidence: "Repeated as essential" },
      { name: "Mentoring", priority: -5, evidence: "A support topic" },
      { name: "", priority: 80, evidence: "Empty label" },
    ]);

    assert.deepEqual(attributes, [
      { name: "data modeling", priority: 100, evidence: "Repeated as essential" },
      { name: "Mentoring", priority: 0, evidence: "A support topic" },
    ]);
    assert.equal("score" in attributes[0], false);
  });

  it("rejects a response that is not an attribute list", () => {
    assert.throws(() => parseProfessionalAttributes({}), /invalid professional attributes/i);
  });
});