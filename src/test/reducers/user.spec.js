/*
 *  Licensed under the EUPL, Version 1.2 or – as soon they will be approved by
the European Commission - subsequent versions of the EUPL (the "Licence");
You may not use this work except in compliance with the Licence.
You may obtain a copy of the Licence at:

  https://joinup.ec.europa.eu/software/page/eupl

Unless required by applicable law or agreed to in writing, software
distributed under the Licence is distributed on an "AS IS" basis,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the Licence for the specific language governing permissions and
limitations under the Licence. */

import * as types from "../../actions/Types";
import userReducer, { initialState } from "./../../reducers/userReducer";

describe("user reducer", () => {
  test("Should return the initial state", () => {
    expect(userReducer(undefined, {})).toEqual(initialState);
  });

  test("Should navigate to path", () => {
    const editPathChange = {
      type: types.NAVIGATE_TO,
      payload: "/stop_place/",
    };

    expect(userReducer(undefined, editPathChange)).toEqual({
      ...initialState,
      path: "/stop_place/",
    });
  });

  test("Should toggle new stop form visibility", () => {
    expect(
      userReducer(undefined, {
        type: types.TOGGLED_IS_CREATING_NEW_STOP,
        payload: false,
      }),
    ).toEqual({
      ...initialState,
      isCreatingNewStop: true,
    });
  });

  test("Should apply search filters", () => {
    const filters = [];

    expect(
      userReducer(undefined, {
        type: types.APPLIED_STOPTYPE_SEARCH_FILTER,
        payload: filters,
      }),
    ).toEqual({
      ...initialState,
      searchFilters: { ...initialState.searchFilters, stopType: filters },
    });
  });

  test("Should change localization", () => {
    const localization = {
      locale: "nb",
      message: [],
    };

    expect(
      userReducer(undefined, {
        type: types.CHANGED_LOCALIZATION,
        payload: localization,
      }),
    ).toEqual({
      ...initialState,
      localization: localization,
    });
  });

  test("Should apply language change", () => {
    const locale = "nb";

    expect(
      userReducer(undefined, {
        type: types.APPLIED_LOCALE,
        payload: locale,
      }),
    ).toEqual({
      ...initialState,
      appliedLocale: locale,
    });
  });

  test("Should set active baselayer for maps", () => {
    let newBaselayer = "OpenStreetMap";

    expect(
      userReducer(undefined, {
        type: types.CHANGED_ACTIVE_BASELAYER,
        payload: newBaselayer,
      }),
    ).toEqual({
      ...initialState,
      activeBaselayer: newBaselayer,
    });
  });

  describe("search filters", () => {
    test("Should handle REMOVED_ALL_FILTERS", () => {
      const stateWithFilters = {
        ...initialState,
        searchFilters: {
          ...initialState.searchFilters,
          topoiChips: [{ key: 1, text: "Test", type: "county", value: 1 }],
          stopType: ["busStation"],
        },
      };
      const action = { type: types.REMOVED_ALL_FILTERS };
      const expectedState = {
        ...stateWithFilters,
        searchFilters: {
          ...stateWithFilters.searchFilters,
          topoiChips: [],
          stopType: [],
        },
      };
      expect(userReducer(stateWithFilters, action)).toEqual(expectedState);
    });

    test("Should handle TOGGLE_SHOW_FUTURE_AND_EXPIRED", () => {
      const action = {
        type: types.TOGGLE_SHOW_FUTURE_AND_EXPIRED,
        payload: true,
      };
      const expectedState = {
        ...initialState,
        searchFilters: {
          ...initialState.searchFilters,
          showFutureAndExpired: true,
        },
      };
      expect(userReducer(initialState, action)).toEqual(expectedState);
    });

    test("Should handle SET_SEARCH_TEXT", () => {
      const action = {
        type: types.SET_SEARCH_TEXT,
        payload: "search query",
      };
      const expectedState = {
        ...initialState,
        searchFilters: {
          ...initialState.searchFilters,
          text: "search query",
        },
      };
      expect(userReducer(initialState, action)).toEqual(expectedState);
    });
  });

  describe("topographical place chips", () => {
    test("Should handle ADDED_TOPOS_CHIP", () => {
      const newChip = { text: "Test", type: "county", value: 1 };
      const action = {
        type: types.ADDED_TOPOS_CHIP,
        payload: newChip,
      };
      const result = userReducer(initialState, action);
      expect(result.searchFilters.topoiChips).toHaveLength(1);
      expect(result.searchFilters.topoiChips[0]).toEqual({
        ...newChip,
        key: 1,
      });
    });

    test("Should handle DELETED_TOPOS_CHIP", () => {
      const stateWithChip = {
        ...initialState,
        searchFilters: {
          ...initialState.searchFilters,
          topoiChips: [{ key: 1, text: "Test", type: "county", value: 1 }],
        },
      };
      const action = {
        type: types.DELETED_TOPOS_CHIP,
        payload: 1,
      };
      const expectedState = {
        ...stateWithChip,
        searchFilters: {
          ...stateWithChip.searchFilters,
          topoiChips: [],
        },
      };
      expect(userReducer(stateWithChip, action)).toEqual(expectedState);
    });
  });

  describe("user authentication", () => {
    test("Should handle APOLLO_QUERY_RESULT for getUserPermissions", () => {
      const action = {
        type: types.APOLLO_QUERY_RESULT,
        operationName: "getUserPermissions",
        result: {
          data: {
            userPermissions: {
              isGuest: false,
              allowNewStopEverywhere: true,
            },
          },
        },
      };
      const expectedState = {
        ...initialState,
        isGuest: false,
        allowNewStopEverywhere: true,
      };
      expect(userReducer(initialState, action)).toEqual(expectedState);
    });

    test("Should handle APOLLO_QUERY_RESULT for getLocationPermissions", () => {
      const action = {
        type: types.APOLLO_QUERY_RESULT,
        operationName: "getLocationPermissions",
        result: {
          data: {
            locationPermissions: {
              allowedStopPlaceTypes: ["busStation", "railStation"],
              allowedSubmodes: ["localBus", "railReplacementBus"],
              bannedStopPlaceTypes: ["ferryStop"],
              bannedSubmodes: ["touristRailway"],
              canDelete: true,
              canEdit: true,
            },
          },
        },
      };
      const expectedState = {
        ...initialState,
        locationPermissions: {
          allowedStopPlaceTypes: ["busStation", "railStation"],
          allowedSubmodes: ["localBus", "railReplacementBus"],
          bannedStopPlaceTypes: ["ferryStop"],
          bannedSubmodes: ["touristRailway"],
          canDelete: true,
          canEdit: true,
        },
      };
      expect(userReducer(initialState, action)).toEqual(expectedState);
    });

    test("Should handle UPDATED_AUTH", () => {
      const authData = {
        token: "test-token",
        username: "test-user",
      };
      const action = {
        type: types.UPDATED_AUTH,
        payload: authData,
      };
      const expectedState = {
        ...initialState,
        auth: authData,
      };
      expect(userReducer(initialState, action)).toEqual(expectedState);
    });
  });

  describe("UI state management", () => {
    test("Should handle SHOW_EDIT_QUAY_ADDITIONAL", () => {
      const action = {
        type: types.SHOW_EDIT_QUAY_ADDITIONAL,
      };
      const expectedState = {
        ...initialState,
        showEditQuayAdditional: true,
      };
      expect(userReducer(initialState, action)).toEqual(expectedState);
    });

    test("Should handle HIDE_EDIT_QUAY_ADDITIONAL", () => {
      const stateWithQuayEdit = {
        ...initialState,
        showEditQuayAdditional: true,
      };
      const action = {
        type: types.HIDE_EDIT_QUAY_ADDITIONAL,
      };
      const expectedState = {
        ...stateWithQuayEdit,
        showEditQuayAdditional: false,
      };
      expect(userReducer(stateWithQuayEdit, action)).toEqual(expectedState);
    });

    test("Should handle SHOW_EDIT_STOP_ADDITIONAL", () => {
      const action = {
        type: types.SHOW_EDIT_STOP_ADDITIONAL,
      };
      const expectedState = {
        ...initialState,
        showEditStopAdditional: true,
      };
      expect(userReducer(initialState, action)).toEqual(expectedState);
    });

    test("Should handle HID_EDIT_STOP_ADDITIONAL", () => {
      const stateWithStopEdit = {
        ...initialState,
        showEditStopAdditional: true,
      };
      const action = {
        type: types.HID_EDIT_STOP_ADDITIONAL,
      };
      const expectedState = {
        ...stateWithStopEdit,
        showEditStopAdditional: false,
      };
      expect(userReducer(stateWithStopEdit, action)).toEqual(expectedState);
    });

    test("Should handle SET_FOCUS_ON_ELEMENT with positive index", () => {
      const action = {
        type: types.SET_FOCUS_ON_ELEMENT,
        payload: { index: 1 },
      };
      const stateWithStopEdit = {
        ...initialState,
        showEditStopAdditional: true,
      };
      const expectedState = {
        ...stateWithStopEdit,
        showEditStopAdditional: false,
      };
      expect(userReducer(stateWithStopEdit, action)).toEqual(expectedState);
    });

    test("Should handle SET_FOCUS_ON_ELEMENT with negative index", () => {
      const action = {
        type: types.SET_FOCUS_ON_ELEMENT,
        payload: { index: -1 },
      };
      const stateWithStopEdit = {
        ...initialState,
        showEditStopAdditional: true,
      };
      expect(userReducer(stateWithStopEdit, action)).toEqual(stateWithStopEdit);
    });

    test("Should handle CHANGED_QUAY_ADDITIONAL_TAB", () => {
      const action = {
        type: types.CHANGED_QUAY_ADDITIONAL_TAB,
        payload: 1,
      };
      const expectedState = {
        ...initialState,
        activeQuayAdditionalTab: 1,
      };
      expect(userReducer(initialState, action)).toEqual(expectedState);
    });
  });

  describe("key values dialog", () => {
    test("Should handle OPENED_KEY_VALUES_DIALOG", () => {
      const action = {
        type: types.OPENED_KEY_VALUES_DIALOG,
        payload: {
          type: "quay",
          index: 0,
        },
      };
      const expectedState = {
        ...initialState,
        keyValuesDialogOpen: true,
        keyValuesOrigin: {
          type: "quay",
          index: 0,
        },
      };
      expect(userReducer(initialState, action)).toEqual(expectedState);
    });

    test("Should handle CLOSED_KEY_VALUES_DIALOG", () => {
      const stateWithDialog = {
        ...initialState,
        keyValuesDialogOpen: true,
        keyValuesOrigin: {
          type: "quay",
          index: 0,
        },
      };
      const action = {
        type: types.CLOSED_KEY_VALUES_DIALOG,
      };
      const expectedState = {
        ...stateWithDialog,
        keyValuesDialogOpen: false,
      };
      expect(userReducer(stateWithDialog, action)).toEqual(expectedState);
    });
  });

  describe("stop place management", () => {
    test("Should handle SET_MISSING_COORDINATES", () => {
      const action = {
        type: types.SET_MISSING_COORDINATES,
        payload: {
          stopPlaceId: "NSR:StopPlace:1",
          position: { lat: 60.1234, lng: 10.1234 },
        },
      };
      const expectedState = {
        ...initialState,
        missingCoordsMap: {
          "NSR:StopPlace:1": { lat: 60.1234, lng: 10.1234 },
        },
      };
      expect(userReducer(initialState, action)).toEqual(expectedState);
    });

    test("Should handle SHOW_CREATED_NEW_STOP_INFO", () => {
      const action = {
        type: types.SHOW_CREATED_NEW_STOP_INFO,
        payload: "NSR:StopPlace:1",
      };
      const expectedState = {
        ...initialState,
        newStopCreated: {
          open: true,
          stopPlaceId: "NSR:StopPlace:1",
        },
      };
      expect(userReducer(initialState, action)).toEqual(expectedState);
    });

    test("Should handle HIDE_CREATED_NEW_STOP_INFO", () => {
      const stateWithNewStop = {
        ...initialState,
        newStopCreated: {
          open: true,
          stopPlaceId: "NSR:StopPlace:1",
        },
      };
      const action = {
        type: types.HIDE_CREATED_NEW_STOP_INFO,
      };
      const expectedState = {
        ...stateWithNewStop,
        newStopCreated: {
          open: false,
          stopPlaceId: null,
        },
      };
      expect(userReducer(stateWithNewStop, action)).toEqual(expectedState);
    });

    test("Should handle TERMINATE_DELETE_STOP_DIALOG_WARNING", () => {
      const action = {
        type: types.TERMINATE_DELETE_STOP_DIALOG_WARNING,
        payload: {
          warning: true,
          stopPlaceId: "NSR:StopPlace:1",
        },
      };
      const expectedState = {
        ...initialState,
        deleteStopDialogWarning: {
          warning: true,
          stopPlaceId: "NSR:StopPlace:1",
        },
      };
      expect(userReducer(initialState, action)).toEqual(expectedState);
    });
  });

  describe("element management", () => {
    test("Should handle ADDED_STOP_PLACE_ELEMENT for quay", () => {
      const action = {
        type: types.ADDED_STOP_PLACE_ELEMENT,
        payload: { type: "quay" },
      };
      const expectedState = {
        ...initialState,
        activeElementTab: 0,
      };
      expect(userReducer(initialState, action)).toEqual(expectedState);
    });

    test("Should handle ADDED_STOP_PLACE_ELEMENT for parkAndRide", () => {
      const action = {
        type: types.ADDED_STOP_PLACE_ELEMENT,
        payload: { type: "parkAndRide" },
      };
      const expectedState = {
        ...initialState,
        activeElementTab: 1,
      };
      expect(userReducer(initialState, action)).toEqual(expectedState);
    });

    test("Should handle CHANGED_ELEMENT_TYPE_TAB", () => {
      const action = {
        type: types.CHANGED_ELEMENT_TYPE_TAB,
        payload: 1,
      };
      const expectedState = {
        ...initialState,
        activeElementTab: 1,
      };
      expect(userReducer(initialState, action)).toEqual(expectedState);
    });
  });
});
