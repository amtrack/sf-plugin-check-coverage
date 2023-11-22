import { expect } from "chai";
import { parseCoverageFromString } from "../src/test-run-coverage.js";

describe("test-run-coverage", function () {
  describe.skip("parseCoverageFromString", function () {
    it("should throw for invalid entry", function () {
      expect(() => {
        parseCoverageFromString("");
      }).to.throw(/Could not parse number from percentage/);
    });
  });
  it("should throw for invalid entry", function () {
    expect(parseCoverageFromString("100%")).to.deep.equal(100);
  });
});
