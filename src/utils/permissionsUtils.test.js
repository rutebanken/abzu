import stopTypes from "../models/stopTypes";
import {
  getAllowanceInfoFromLocationPermissions,
  getLegalStopPlaceTypes,
  getLegalSubmodesForStopPlace,
  getStopPermissions,
  isStopFromSearch,
} from "./permissionsUtils";

describe("getLegalStopPlaceTypes", () => {
  it("returns all stop types for empty allowed and banned stop place types", () => {
    expect(
      getLegalStopPlaceTypes({
        allowedStopPlaceTypes: [],
        bannedStopPlaceTypes: [],
      }),
    ).toEqual(Object.keys(stopTypes));
  });

  it("returns all stop types for wildcarded allowedStopPlaceTypes", () => {
    expect(
      getLegalStopPlaceTypes({
        allowedStopPlaceTypes: ["*"],
        bannedStopPlaceTypes: [],
      }),
    ).toEqual(Object.keys(stopTypes));
  });

  it("returns the empty list for wildcarded bannedStopPlaceTypes", () => {
    expect(
      getLegalStopPlaceTypes({
        allowedStopPlaceTypes: [],
        bannedStopPlaceTypes: ["*"],
      }),
    ).toEqual([]);
  });

  it("returns difference between allowed and banned when allowed list is non-empty", () => {
    expect(
      getLegalStopPlaceTypes({
        allowedStopPlaceTypes: ["railStation", "onstreetBus"],
        bannedStopPlaceTypes: ["railStation"],
      }),
    ).toEqual(["onstreetBus"]);
  });

  it("returns all stop place types except banned, when allowed list is empty", () => {
    expect(
      getLegalStopPlaceTypes({
        allowedStopPlaceTypes: [],
        bannedStopPlaceTypes: ["railStation"],
      }),
    ).toEqual(Object.keys(stopTypes).filter((type) => type !== "railStation"));
  });
});

describe("getLegalSubmodesForStopPlace", () => {
  it("returns all submodes for empty allowed and banned submodes", () => {
    expect(
      getLegalSubmodesForStopPlace({
        permissions: {
          allowedStopPlaceTypes: [],
          bannedStopPlaceTypes: [],
          allowedSubmodes: [],
          bannedSubmodes: [],
        },
      }),
    ).toEqual(
      Object.values(stopTypes).reduce((acc, stopType) => {
        return [...acc, ...(stopType.submodes ? stopType.submodes : [])];
      }, []),
    );
  });

  it("returns all submodes for wildcarded allowedSubmodes", () => {
    expect(
      getLegalSubmodesForStopPlace({
        permissions: {
          allowedStopPlaceTypes: [],
          bannedStopPlaceTypes: [],
          allowedSubmodes: ["*"],
          bannedSubmodes: [],
        },
      }),
    ).toEqual(
      Object.values(stopTypes).reduce((acc, stopType) => {
        return [...acc, ...(stopType.submodes ? stopType.submodes : [])];
      }, []),
    );
  });

  it("returns the empty list for wildcarded bannedSubmodes", () => {
    expect(
      getLegalSubmodesForStopPlace({
        permissions: {
          allowedStopPlaceTypes: [],
          bannedStopPlaceTypes: [],
          allowedSubmodes: [],
          bannedSubmodes: ["*"],
        },
      }),
    ).toEqual([]);
  });

  it("returns difference between allowed and banned when allowed list is non-empty", () => {
    expect(
      getLegalSubmodesForStopPlace({
        permissions: {
          allowedStopPlaceTypes: [],
          bannedStopPlaceTypes: [],
          allowedSubmodes: ["localBus", "nightBus"],
          bannedSubmodes: ["localBus"],
        },
      }),
    ).toEqual(["nightBus"]);
  });

  it("returns all submodes except banned, when allowed list is empty", () => {
    expect(
      getLegalSubmodesForStopPlace({
        permissions: {
          allowedStopPlaceTypes: [],
          bannedStopPlaceTypes: [],
          allowedSubmodes: [],
          bannedSubmodes: ["localBus"],
        },
      }),
    ).toEqual(
      Object.values(stopTypes)
        .reduce((acc, stopType) => {
          return [...acc, ...(stopType.submodes ? stopType.submodes : [])];
        }, [])
        .filter((type) => type !== "localBus"),
    );
  });

  it("returns submodes only from allowed stop place types when specified", () => {
    expect(
      getLegalSubmodesForStopPlace({
        permissions: {
          allowedStopPlaceTypes: ["onstreetBus"],
          bannedStopPlaceTypes: [],
          allowedSubmodes: [],
          bannedSubmodes: [],
        },
      }),
    ).toEqual([
      "expressBus",
      "railReplacementBus",
      "airportLinkBus",
      "localBus",
      "nightBus",
      "regionalBus",
      "shuttleBus",
      "schoolBus",
      "sightseeingBus",
    ]);
  });

  it("excludes submodes from banned stop place types", () => {
    expect(
      getLegalSubmodesForStopPlace({
        permissions: {
          allowedStopPlaceTypes: [],
          bannedStopPlaceTypes: ["onstreetBus"],
          allowedSubmodes: [],
          bannedSubmodes: [],
        },
      }),
    ).toEqual(
      Object.values(stopTypes)
        .reduce((acc, stopType) => {
          return [...acc, ...(stopType.submodes ? stopType.submodes : [])];
        }, [])
        .filter((submode) => !stopTypes.onstreetBus.submodes.includes(submode)),
    );
  });

  it("correctly handles combination of allowed stop types and allowed submodes", () => {
    expect(
      getLegalSubmodesForStopPlace({
        permissions: {
          allowedStopPlaceTypes: ["onstreetBus"],
          bannedStopPlaceTypes: [],
          allowedSubmodes: ["localBus", "nightBus"],
          bannedSubmodes: [],
        },
      }),
    ).toEqual(["localBus", "nightBus"]);
  });

  it("correctly handles combination of allowed stop types and banned submodes", () => {
    expect(
      getLegalSubmodesForStopPlace({
        permissions: {
          allowedStopPlaceTypes: ["onstreetBus"],
          bannedStopPlaceTypes: [],
          allowedSubmodes: [],
          bannedSubmodes: ["localBus", "nightBus"],
        },
      }),
    ).toEqual([
      "expressBus",
      "railReplacementBus",
      "airportLinkBus",
      "regionalBus",
      "shuttleBus",
      "schoolBus",
      "sightseeingBus",
    ]);
  });

  it("returns submodes correctly when wildcard in allowed submodes is used in combination with banned submodes", () => {
    expect(
      getLegalSubmodesForStopPlace({
        permissions: {
          allowedStopPlaceTypes: ["onstreetBus"],
          bannedStopPlaceTypes: [],
          allowedSubmodes: ["*"],
          bannedSubmodes: ["localBus", "nightBus"],
        },
      }),
    ).toEqual([
      "expressBus",
      "railReplacementBus",
      "airportLinkBus",
      "regionalBus",
      "shuttleBus",
      "schoolBus",
      "sightseeingBus",
    ]);
  });
});

describe("getAllowanceInfoFromLocationPermissions", () => {
  it("returns default values when locationPermissions is null", () => {
    expect(getAllowanceInfoFromLocationPermissions(null)).toEqual({
      canEdit: false,
      canDelete: false,
      legalStopPlaceTypes: [],
      legalSubmodes: [],
    });
  });

  it("returns correct allowance info for valid permissions", () => {
    const locationPermissions = {
      canEdit: true,
      canDelete: true,
      allowedStopPlaceTypes: ["onstreetBus"],
      bannedStopPlaceTypes: [],
      allowedSubmodes: ["localBus"],
      bannedSubmodes: [],
    };
    expect(
      getAllowanceInfoFromLocationPermissions(locationPermissions),
    ).toEqual({
      canEdit: true,
      canDelete: true,
      legalStopPlaceTypes: ["onstreetBus"],
      legalSubmodes: ["localBus"],
    });
  });

  it("handles wildcard in banned types correctly", () => {
    const locationPermissions = {
      canEdit: true,
      canDelete: true,
      allowedStopPlaceTypes: ["onstreetBus"],
      bannedStopPlaceTypes: ["*"],
      allowedSubmodes: ["localBus"],
      bannedSubmodes: [],
    };
    expect(
      getAllowanceInfoFromLocationPermissions(locationPermissions),
    ).toEqual({
      canEdit: true,
      canDelete: true,
      legalStopPlaceTypes: [],
      legalSubmodes: ["localBus"],
    });
  });
});

describe("getStopPermissions", () => {
  it("returns default permissions when stopPlace is null", () => {
    expect(getStopPermissions(null)).toEqual({
      canEdit: false,
      canDelete: false,
      legalStopPlaceTypes: [],
      legalSubmodes: [],
    });
  });

  it("returns stopPlace permissions when available", () => {
    const stopPlace = {
      permissions: {
        canEdit: true,
        canDelete: true,
        allowedStopPlaceTypes: ["onstreetBus"],
        allowedSubmodes: ["localBus"],
        bannedStopPlaceTypes: [],
        bannedSubmodes: [],
      },
    };
    expect(getStopPermissions(stopPlace)).toEqual({
      blacklistedStopPlaceTypes: [],
      canDeleteStop: true,
      canEdit: true,
      legalStopPlaceTypes: ["onstreetBus"],
      legalSubmodes: ["localBus"],
    });
  });

  it("returns default permissions when stopPlace has no permissions", () => {
    expect(getStopPermissions({})).toEqual({
      canEdit: false,
      canDelete: false,
      legalStopPlaceTypes: [],
      legalSubmodes: [],
    });
  });
});

describe("isStopFromSearch", () => {
  const mockStopId = "NSR:StopPlace:123";
  const baseState = {
    stopPlace: {
      searchResults: [],
      activeSearchResult: null,
    },
  };

  it("returns false when stopId is null", () => {
    expect(isStopFromSearch(baseState, null)).toBe(false);
  });

  it("returns false when stopId is undefined", () => {
    expect(isStopFromSearch(baseState, undefined)).toBe(false);
  });

  it("returns false when stop is not in search results and not active result", () => {
    expect(isStopFromSearch(baseState, mockStopId)).toBe(false);
  });

  it("returns true when stop is the active search result", () => {
    const state = {
      ...baseState,
      stopPlace: {
        ...baseState.stopPlace,
        activeSearchResult: { id: mockStopId },
      },
    };
    expect(isStopFromSearch(state, mockStopId)).toBe(true);
  });

  it("returns true when stop is in search results", () => {
    const state = {
      ...baseState,
      stopPlace: {
        ...baseState.stopPlace,
        searchResults: [{ id: mockStopId }],
      },
    };
    expect(isStopFromSearch(state, mockStopId)).toBe(true);
  });

  it("returns true when stop is both in search results and active result", () => {
    const state = {
      ...baseState,
      stopPlace: {
        ...baseState.stopPlace,
        searchResults: [{ id: mockStopId }],
        activeSearchResult: { id: mockStopId },
      },
    };
    expect(isStopFromSearch(state, mockStopId)).toBe(true);
  });

  it("handles undefined searchResults gracefully", () => {
    const state = {
      stopPlace: {
        activeSearchResult: null,
      },
    };
    expect(isStopFromSearch(state, mockStopId)).toBe(false);
  });

  it("returns false for a different stop id", () => {
    const state = {
      stopPlace: {
        searchResults: [{ id: mockStopId }],
        activeSearchResult: { id: mockStopId },
      },
    };
    expect(isStopFromSearch(state, "NSR:StopPlace:456")).toBe(false);
  });
});
