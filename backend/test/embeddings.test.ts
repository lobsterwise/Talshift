import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hashAttributeText, normalizeAttributeText } from "../src/embeddings";

describe("attribute embedding keys", () => {
  it("normalizes Unicode, case, and whitespace", () => {
    assert.equal(normalizeAttributeText("  Data   SCIENCE\u00a0 "), "data science");
  });

  it("uses a stable hash for equivalent attribute labels", () => {
    assert.equal(hashAttributeText("SQL  Querying"), hashAttributeText(" sql querying "));
    assert.notEqual(hashAttributeText("SQL"), hashAttributeText("NoSQL"));
  });
});