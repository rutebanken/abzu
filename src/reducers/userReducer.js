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

import * as types from "../actions/Types";
import SettingsManager from "../singletons/SettingsManager";

const Settings = new SettingsManager();

export const initialState = {
  path: "/",
  isCreatingNewStop: false,
  missingCoordsMap: {},
  searchFilters: {
    stopType: [],
    topoiChips: [
      // e.g. {key: 0, text: 'Nordland', type: 'county', value: 2},
    ],
    text: "",
    showFutureAndExpired: false,
  },
  snackbarOptions: {
    isOpen: false,
    message: "",
  },
  localization: {
    locale: null,
    messages: [],
  },
  appliedLocale: null,
  favoriteNameDialogIsOpen: false,
  removedFavorites: [],
  activeElementTab: 0,
  activeBaselayer: Settings.getMapLayer(),
  showEditQuayAdditional: false,
  activeQuayAdditionalTab: 0,
  showEditStopAdditional: false,
  keyValuesDialogOpen: false,
  keyValuesDialogSource: [],
  keyValuesOrigin: null,
  lookupCoordinatesOpen: false,
  newStopIsMultiModal: false,
  serverTimeDiff: 0,
  deleteStopDialogWarning: {
    warning: false,
    stopPlaceId: null,
  },
  newStopCreated: {
    open: false,
    stopPlaceId: null,
  },
  showPublicCode: Settings.getShowPublicCode(),
  adjacentStopDialogOpen: false,
  auth: {},
  isGuest: true,
  allowNewStopEverywhere: false,
};

const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case "@@router/LOCATION_CHANGE":
    case types.NAVIGATE_TO:
      return Object.assign({}, state, {
        path: action.payload,
        showEditQuayAdditional: false,
        showEditStopAdditional: false,
        isCreatingNewStop: false,
        keyValuesDialogOpen: false,
        deleteStopDialogWarning: {
          warning: false,
          stopPlaceId: null,
        },
      });

    case types.TOGGLED_IS_CREATING_NEW_STOP:
      return Object.assign({}, state, {
        isCreatingNewStop: !state.isCreatingNewStop,
        newStopIsMultiModal: action.payload,
      });

    case types.APPLIED_STOPTYPE_SEARCH_FILTER:
      return Object.assign({}, state, {
        searchFilters: { ...state.searchFilters, stopType: action.payload },
      });

    case types.REMOVED_ALL_FILTERS:
      return Object.assign({}, state, {
        searchFilters: { ...state.searchFilters, topoiChips: [], stopType: [] },
      });

    case types.OPEN_LOOKUP_COORDINATES_DIALOG:
      return Object.assign({}, state, {
        lookupCoordinatesOpen: true,
      });

    case types.CLOSED_LOOKUP_COORDINATES_DIALOG:
      return Object.assign({}, state, {
        lookupCoordinatesOpen: false,
      });

    case types.CHANGED_LOCALIZATION:
      return Object.assign({}, state, { localization: action.payload });

    case types.APPLIED_LOCALE:
      return Object.assign({}, state, { appliedLocale: action.payload });

    case types.ADDED_TOPOS_CHIP:
      let newChipList = state.searchFilters.topoiChips.splice(0);
      let newChipToAdd = action.payload;
      newChipToAdd.key = newChipList.push(newChipToAdd);
      return Object.assign({}, state, {
        searchFilters: {
          ...state.searchFilters,
          topoiChips: newChipList,
        },
      });

    case types.DELETED_TOPOS_CHIP:
      let chips = state.searchFilters.topoiChips.filter(
        (chip) => chip.value !== action.payload,
      );
      return Object.assign({}, state, {
        searchFilters: {
          ...state.searchFilters,
          topoiChips: chips,
        },
      });

    case types.SHOW_CREATED_NEW_STOP_INFO:
      return Object.assign({}, state, {
        newStopCreated: {
          open: true,
          stopPlaceId: action.payload,
        },
      });

    case types.HIDE_CREATED_NEW_STOP_INFO:
      return Object.assign({}, state, {
        newStopCreated: {
          open: false,
          stopPlaceId: null,
        },
      });

    case types.SET_TOPOS_CHIPS:
      return Object.assign({}, state, {
        searchFilters: {
          ...state.searchFilters,
          topoiChips: action.payload,
        },
      });

    case types.SET_STOP_PLACE_TYPES:
      return Object.assign({}, state, {
        searchFilters: {
          ...state.searchFilters,
          stopType: action.payload,
        },
      });

    case types.TOGGLE_SHOW_FUTURE_AND_EXPIRED:
      return Object.assign({}, state, {
        searchFilters: {
          ...state.searchFilters,
          showFutureAndExpired: action.payload,
        },
      });

    case types.SET_SEARCH_TEXT:
      return Object.assign({}, state, {
        searchFilters: {
          ...state.searchFilters,
          text: action.payload,
        },
      });

    case types.OPENED_FAVORITE_NAME_DIALOG:
      return Object.assign({}, state, { favoriteNameDialogIsOpen: true });

    case types.CLOSED_FAVORITE_NAME_DIALOG:
      return Object.assign({}, state, { favoriteNameDialogIsOpen: false });

    case types.REMOVE_SEARCH_AS_FAVORITE:
      return Object.assign({}, state, {
        removedFavorites: state.removedFavorites.concat(action.payload),
      });

    case types.REQUESTED_ADJACENT_SITE_DIALOG:
      return Object.assign({}, state, {
        adjacentStopDialogOpen: true,
        adjacentStopDialogStopPlace: action.payload,
      });

    case types.CLOSED_ADJACENT_SITE_DIALOG:
      return Object.assign({}, state, {
        adjacentStopDialogOpen: false,
      });

    case types.CHANGED_ACTIVE_BASELAYER:
      return Object.assign({}, state, { activeBaselayer: action.payload });

    case types.SET_MISSING_COORDINATES:
      let newMissingCoordsMap = Object.assign({}, state.missingCoordsMap);
      newMissingCoordsMap[action.payload.stopPlaceId] = action.payload.position;
      return Object.assign({}, state, {
        missingCoordsMap: newMissingCoordsMap,
      });

    case types.CHANGED_ELEMENT_TYPE_TAB:
      return Object.assign({}, state, { activeElementTab: action.payload });

    case types.ADDED_STOP_PLACE_ELEMENT:
      let activeElementTabIndex = -1;

      if (
        action.payload.type === "quay" ||
        action.payload.type === "boardingPosition"
      ) {
        activeElementTabIndex = 0;
      } else if (
        action.payload.type === "parkAndRide" ||
        action.payload.type === "bikeParking"
      ) {
        activeElementTabIndex = 1;
      } else {
        console.warn("type is not supported", action.payload.type);
        activeElementTabIndex = -1;
      }

      return Object.assign({}, state, {
        activeElementTab: activeElementTabIndex,
      });

    case types.SHOW_EDIT_QUAY_ADDITIONAL:
      return Object.assign({}, state, {
        showEditQuayAdditional: true,
      });

    case types.CHANGED_QUAY_ADDITIONAL_TAB:
      return Object.assign({}, state, {
        activeQuayAdditionalTab: action.payload,
      });

    case types.HIDE_EDIT_QUAY_ADDITIONAL:
      return Object.assign({}, state, {
        showEditQuayAdditional: false,
      });

    case types.SHOW_EDIT_STOP_ADDITIONAL:
      return Object.assign({}, state, {
        showEditStopAdditional: true,
      });

    case types.SET_FOCUS_ON_ELEMENT:
      if (action.payload.index > -1) {
        return Object.assign({}, state, {
          showEditStopAdditional: false,
        });
      }

      return state;

    case types.HID_EDIT_STOP_ADDITIONAL:
      return Object.assign({}, state, {
        showEditStopAdditional: false,
      });

    case types.OPENED_KEY_VALUES_DIALOG:
      return Object.assign({}, state, {
        keyValuesDialogOpen: true,
        keyValuesOrigin: {
          type: action.payload.type,
          index: action.payload.index,
        },
      });

    case types.CLOSED_KEY_VALUES_DIALOG:
      return Object.assign({}, state, {
        keyValuesDialogOpen: false,
      });

    case types.SORTED_QUAYS:
      return Object.assign({}, state, {
        keyValuesDialogOpen: false,
        showEditStopAdditional: false,
        showEditQuayAdditional: false,
      });

    case types.TOGGLE_SHOW_PUBLIC_CODE:
      return Object.assign({}, state, {
        showPublicCode: action.payload,
      });

    case types.TERMINATE_DELETE_STOP_DIALOG_WARNING:
      return Object.assign({}, state, {
        deleteStopDialogWarning: action.payload,
      });

    case types.APOLLO_QUERY_RESULT:
      if (action.operationName === "getUserPermissions") {
        return {
          ...state,
          isGuest: action.result.data.userPermissions.isGuest,
          allowNewStopEverywhere:
            action.result.data.userPermissions.allowNewStopEverywhere,
        };
      } else if (action.operationName === "getLocationPermissions") {
        return {
          ...state,
          locationPermissions: action.result.data.locationPermissions,
        };
      }
      return state;

    case types.UPDATED_AUTH:
      return {
        ...state,
        auth: action.payload,
      };

    default:
      return state;
  }
};

export default userReducer;
