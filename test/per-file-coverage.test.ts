import { expect } from "chai";
import { getMetadataMemberFromTestResultEntry } from "../src/per-file-coverage.js";

describe("per-file-coverage", function () {
  describe("getMetadataMemberFromTestResultEntry", function () {
    it("should throw for invalid entry", function () {
      expect(() => {
        getMetadataMemberFromTestResultEntry({
          id: "foo",
          name: "Invalid",
          coveredPercent: 10,
        });
      }).to.throw(/Could not determine MetadataMember from Test Result Entry/);
    });
  });
});
