import { submodes } from "../models/submodes";
import {
  getInverseSubmodesWhitelist,
  getStopTypesForSubmodes,
} from "./modeUtils";

describe("modeUtils", () => {
  describe("getInverseSubmodesWhitelist", () => {
    it("should return all submodes except those in whitelist", () => {
      const whitelist = ["localBus", "expressBus", "nightBus"];
      const result = getInverseSubmodesWhitelist(whitelist);

      // Should not include whitelisted modes
      expect(result).not.toContain("localBus");
      expect(result).not.toContain("expressBus");
      expect(result).not.toContain("nightBus");

      // Should include other modes
      expect(result).toContain("railReplacementBus");
      expect(result).toContain("localTram");
      expect(result).toContain("metro");
    });

    it("should return all submodes when whitelist is empty", () => {
      const result = getInverseSubmodesWhitelist([]);
      expect(result).toEqual(submodes);
    });

    it("should return empty array when whitelist contains all submodes", () => {
      const result = getInverseSubmodesWhitelist(submodes);
      expect(result).toEqual([]);
    });
  });

  describe("getStopTypesForSubmodes", () => {
    it("should return empty array when no submodes are provided", () => {
      expect(getStopTypesForSubmodes([])).toEqual([]);
      expect(getStopTypesForSubmodes(null)).toEqual([]);
      expect(getStopTypesForSubmodes(undefined)).toEqual([]);
    });

    it("should return correct stop types for bus submodes", () => {
      const busSubmodes = ["localBus", "expressBus", "nightBus"];
      const result = getStopTypesForSubmodes(busSubmodes);

      // onstreetBus should be included as it supports these submodes
      expect(result).toContain("onstreetBus");

      // These stop types should not be included as they don't support bus submodes
      expect(result).not.toContain("railStation");
      expect(result).not.toContain("ferryStop");
    });

    it("should return correct stop types for rail submodes", () => {
      const railSubmodes = ["longDistance", "nightRail", "regionalRail"];
      const result = getStopTypesForSubmodes(railSubmodes);

      // railStation should be included as it supports these submodes
      expect(result).toContain("railStation");

      // These stop types should not be included as they don't support rail submodes
      expect(result).not.toContain("onstreetBus");
      expect(result).not.toContain("ferryStop");
    });

    it("should return correct stop types for water transport submodes", () => {
      const waterSubmodes = [
        "highSpeedPassengerService",
        "localPassengerFerry",
        "internationalPassengerFerry",
      ];
      const result = getStopTypesForSubmodes(waterSubmodes);

      // ferryStop should be included as it supports passenger ferry submodes
      expect(result).toContain("ferryStop");

      // harbourPort should be included as it supports highSpeedPassengerService
      expect(result).toContain("harbourPort");

      // These stop types should not be included
      expect(result).not.toContain("onstreetBus");
      expect(result).not.toContain("railStation");
    });

    it("should handle null values in submodes list", () => {
      const result = getStopTypesForSubmodes([null, "localBus", null]);

      // Should only consider the valid submode
      expect(result).toContain("onstreetBus");
      expect(result.length).toBe(1);
    });

    it("should not return duplicate stop types", () => {
      // Multiple submodes that map to the same stop type
      const busSubmodes = ["localBus", "expressBus", "nightBus", "regionalBus"];
      const result = getStopTypesForSubmodes(busSubmodes);

      // Should only include onstreetBus once
      expect(result.filter((type) => type === "onstreetBus").length).toBe(1);
    });
  });
});
