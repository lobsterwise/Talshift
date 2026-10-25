import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cleanContact, normalizeEmail, normalizeLinkedIn, normalizePhone } from "../src/contact";

describe("student contact details", () => {
  it("treats blank fields as empty and rejects malformed emails", () => {
    assert.equal(normalizeEmail("  "), "");
    assert.equal(normalizeEmail(" sam@example.edu "), "sam@example.edu");
    assert.equal(normalizeEmail("sam@example"), null);
    assert.equal(normalizeEmail("not an email"), null);
  });

  it("accepts common phone formats and rejects text or too few digits", () => {
    assert.equal(normalizePhone("(555) 123-4567"), "(555) 123-4567");
    assert.equal(normalizePhone("+1 555.123.4567 ext. 89"), "+1 555.123.4567 ext. 89");
    assert.equal(normalizePhone("555-12"), null);
    assert.equal(normalizePhone("call me maybe"), null);
  });

  it("stores LinkedIn profiles as canonical URLs and rejects other links", () => {
    assert.equal(normalizeLinkedIn("linkedin.com/in/sam-lee/"), "https://www.linkedin.com/in/sam-lee");
    assert.equal(normalizeLinkedIn("https://ca.linkedin.com/in/sam-lee?trk=x"), "https://www.linkedin.com/in/sam-lee");
    assert.equal(normalizeLinkedIn("https://www.linkedin.com/company/rungs"), null);
    assert.equal(normalizeLinkedIn("https://evil-linkedin.com/in/sam"), null);
  });

  it("drops invalid values from untrusted sources instead of failing", () => {
    assert.deepEqual(cleanContact({ email: "nope", phone: 5551234567, linkedin: "linkedin.com/in/sam" }), {
      email: "",
      phone: "",
      linkedin: "https://www.linkedin.com/in/sam",
    });
    assert.deepEqual(cleanContact(null), { email: "", phone: "", linkedin: "" });
  });
});
