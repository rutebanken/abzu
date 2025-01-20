import {
  calculateDistance,
  calculateEstimate,
  getChildStopPlaceSuggestions,
  getGroupMemberSuggestions,
  getUniquePathLinks,
  isChildTooFarAway,
  isLegalChildStopPlace,
  isMemberTooFarAway,
} from "./leafletUtils";

describe("leafletUtils", () => {
  describe("getUniquePathLinks", () => {
    it("returns unique items based on key function", () => {
      const input = [
        { id: 1, name: "A" },
        { id: 2, name: "B" },
        { id: 1, name: "C" },
      ];
      const result = getUniquePathLinks(input, (item) => item.id);
      expect(result).toHaveLength(2);
      expect(result).toEqual([
        { id: 1, name: "A" },
        { id: 2, name: "B" },
      ]);
    });

    it("handles empty array", () => {
      const result = getUniquePathLinks([], (item) => item.id);
      expect(result).toEqual([]);
    });
  });

  describe("calculateDistance", () => {
    it("calculates total distance between coordinates", () => {
      const coords = [
        [59.911491, 10.757933],
        [59.913632, 10.752611],
        [59.915864, 10.749607],
      ];
      const result = calculateDistance(coords);
      expect(result).toBe(679.7725172707117);
    });

    it("handles single coordinate", () => {
      const coords = [[59.911491, 10.757933]];
      const result = calculateDistance(coords);
      expect(result).toBe(0);
    });

    it("handles empty array", () => {
      const result = calculateDistance([]);
      expect(result).toBe(0);
    });
  });

  describe("calculateEstimate", () => {
    it("calculates walking time estimate", () => {
      const result = calculateEstimate(300);
      expect(result).toBe(Math.floor(300 / 1.34112));
    });

    it("returns minimum of 1", () => {
      const result = calculateEstimate(1);
      expect(result).toBe(1);
    });
  });

  describe("isChildTooFarAway", () => {
    it("returns true when distance is within limit", () => {
      expect(isChildTooFarAway(200)).toBe(true);
    });

    it("returns false when distance exceeds limit", () => {
      expect(isChildTooFarAway(400)).toBe(false);
    });

    it("uses default value when no distance provided", () => {
      expect(isChildTooFarAway()).toBe(false);
    });
  });

  describe("isMemberTooFarAway", () => {
    it("returns true when distance is within limit", () => {
      expect(isMemberTooFarAway(500)).toBe(true);
    });

    it("returns false when distance exceeds limit", () => {
      expect(isMemberTooFarAway(700)).toBe(false);
    });

    it("uses default value when no distance provided", () => {
      expect(isMemberTooFarAway()).toBe(false);
    });
  });

  describe("getChildStopPlaceSuggestions", () => {
    const mockChildren = [{ id: "child1" }];
    // Jernbanetorget
    const mockCentroid = [59.911491, 10.750933];
    const mockNeighbourStops = [
      {
        id: "stop1",
        isParent: false,
        isChildOfParent: false,
        // Storgata (150m from Jernbanetorget)
        location: [59.912632, 10.751611],
        permissions: { canEdit: true },
      },
      {
        id: "stop2",
        isParent: true,
        isChildOfParent: false,
        // Brugata (200m from Jernbanetorget)
        location: [59.913164, 10.751607],
        permissions: { canEdit: true },
      },
      {
        id: "stop3",
        isParent: false,
        isChildOfParent: true,
        // Hausmanns gate (250m from Jernbanetorget)
        location: [59.913864, 10.751607],
        permissions: { canEdit: true },
      },
      {
        id: "child1",
        isParent: false,
        isChildOfParent: false,
        // Oslo S (100m from Jernbanetorget)
        location: [59.911864, 10.751607],
        permissions: { canEdit: true },
      },
    ];

    it("filters out parent stops and children of parent stops", () => {
      const result = getChildStopPlaceSuggestions(
        mockChildren,
        mockCentroid,
        mockNeighbourStops,
        10,
      );
      expect(result.length).toBeLessThan(mockNeighbourStops.length);
      expect(
        result.every((stop) => !stop.isParent && !stop.isChildOfParent),
      ).toBe(true);
    });

    it("filters out already added children", () => {
      const result = getChildStopPlaceSuggestions(
        mockChildren,
        mockCentroid,
        mockNeighbourStops,
        10,
      );
      expect(result.every((stop) => stop.id !== "child1")).toBe(true);
    });

    it("limits results to nFirst", () => {
      const result = getChildStopPlaceSuggestions(
        mockChildren,
        mockCentroid,
        mockNeighbourStops,
        1,
      );
      expect(result).toHaveLength(1);
    });
  });

  describe("getGroupMemberSuggestions", () => {
    const mockMembers = [{ id: "member1" }];
    // Oslo S
    const mockCentroid = [59.911491, 10.750933];
    const mockNeighbourStops = [
      {
        id: "stop1",
        isChildOfParent: false,
        // Jernbanetorget (300m from Oslo S)
        location: [59.913632, 10.751611],
        permissions: { canEdit: true },
      },
      {
        id: "stop2",
        isChildOfParent: true,
        // Grønland (400m from Oslo S)
        location: [59.914864, 10.751607],
        permissions: { canEdit: true },
      },
      {
        id: "member1",
        isChildOfParent: false,
        // Bussterminalen (200m from Oslo S)
        location: [59.912864, 10.751607],
        permissions: { canEdit: true },
      },
    ];

    it("filters out children of parent stops", () => {
      const result = getGroupMemberSuggestions(
        mockMembers,
        mockCentroid,
        mockNeighbourStops,
        10,
      );
      expect(result.every((stop) => !stop.isChildOfParent)).toBe(true);
    });

    it("filters out already added members", () => {
      const result = getGroupMemberSuggestions(
        mockMembers,
        mockCentroid,
        mockNeighbourStops,
        10,
      );
      expect(result.every((stop) => stop.id !== "member1")).toBe(true);
    });

    it("limits results to nFirst", () => {
      const result = getGroupMemberSuggestions(
        mockMembers,
        mockCentroid,
        mockNeighbourStops,
        1,
      );
      expect(result).toHaveLength(1);
    });
  });

  describe("isLegalChildStopPlace", () => {
    it("returns false when stopPlace is null", () => {
      expect(isLegalChildStopPlace(null)).toBe(false);
    });

    it("returns false when stopPlace has no permissions", () => {
      expect(isLegalChildStopPlace({})).toBe(false);
    });

    it("returns false when stopPlace has permissions but canEdit is false", () => {
      expect(isLegalChildStopPlace({ permissions: { canEdit: false } })).toBe(
        false,
      );
    });

    it("returns true when stopPlace has permissions and canEdit is true", () => {
      expect(isLegalChildStopPlace({ permissions: { canEdit: true } })).toBe(
        true,
      );
    });
  });
});
