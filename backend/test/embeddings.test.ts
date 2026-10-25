import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hashAttributeText, isRequestTimeout, normalizeAttributeText } from "../src/embeddings";

describe("attribute embedding keys", () => {
  it("normalizes Unicode, case, and whitespace", () => {
    assert.equal(normalizeAttributeText("  Data   SCIENCE\u00a0 "), "data science");
  });

  it("uses a stable hash for equivalent attribute labels", () => {
    assert.equal(hashAttributeText("SQL  Querying"), hashAttributeText(" sql querying "));
    assert.notEqual(hashAttributeText("SQL"), hashAttributeText("NoSQL"));
  });
});

describe("external request timeouts", () => {
  it("recognizes timeout aborts without classifying ordinary errors", () => {
    const timeout = new Error("The operation was aborted due to timeout");
    timeout.name = "TimeoutError";
    assert.equal(isRequestTimeout(timeout), true);
    assert.equal(isRequestTimeout(new Error("network unavailable")), false);
  });
});