import {
  getLegalStopPlaceTypesForStopPlace,
  getLegalSubmodesForStopPlace,
} from "../../reducers/rolesReducerUtils";
import stopTypes, { submodes } from "../../models/stopTypes";

describe("getLegalStopPlaceTypesForStopPlace", () => {
  it("returns all stop types for empty allowed and banned stop place types", () => {
    expect(
      getLegalStopPlaceTypesForStopPlace({
        permissions: {
          allowedStopPlaceTypes: [],
          bannedStopPlaceTypes: [],
        },
      }),
    ).toEqual(Object.keys(stopTypes));
  });

  it("returns all stop types for wildcarded allowedStopPlaceTypes", () => {
    expect(
      getLegalStopPlaceTypesForStopPlace({
        permissions: {
          allowedStopPlaceTypes: ["*"],
        },
      }),
    ).toEqual(Object.keys(stopTypes));
  });

  it("returns the empty list for wildcarded bannedStopPlaceTypes", () => {
    expect(
      getLegalStopPlaceTypesForStopPlace({
        permissions: {
          allowedStopPlaceTypes: [],
          bannedStopPlaceTypes: ["*"],
        },
      }),
    ).toEqual([]);
  });

  it("returns difference between allowed and banned when allowed list is non-empty", () => {
    expect(
      getLegalStopPlaceTypesForStopPlace({
        permissions: {
          allowedStopPlaceTypes: ["railStation", "onstreetBus"],
          bannedStopPlaceTypes: ["railStation"],
        },
      }),
    ).toEqual(["onstreetBus"]);
  });

  it("returns all stop place types except banned, when allowed list is empty", () => {
    expect(
      getLegalStopPlaceTypesForStopPlace({
        permissions: {
          allowedStopPlaceTypes: [],
          bannedStopPlaceTypes: ["railStation"],
        },
      }),
    ).toEqual(Object.keys(stopTypes).filter((type) => type !== "railStation"));
  });
});

describe("getLegalSubmodesForStopPlace", () => {
  it("returns all submodes for empty allowed and banned submodes", () => {
    expect(
      getLegalSubmodesForStopPlace({
        permissions: {
          allowedSubmodes: [],
          bannedSubmodes: [],
        },
      }),
    ).toEqual(submodes);
  });

  it("returns all submodes for wildcarded allowedSubmodes", () => {
    expect(
      getLegalSubmodesForStopPlace({
        permissions: {
          allowedSubmodes: ["*"],
        },
      }),
    ).toEqual(submodes);
  });

  it("returns the empty list for wildcarded bannedSubmodes", () => {
    expect(
      getLegalSubmodesForStopPlace({
        permissions: {
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
          allowedSubmodes: [],
          bannedSubmodes: ["localBus"],
        },
      }),
    ).toEqual(submodes.filter((type) => type !== "localBus"));
  });
});