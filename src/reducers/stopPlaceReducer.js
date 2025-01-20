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
import AdjacentStopAdder from "../modelUtils/adjacentStopAdder";
import AdjacentStopRemover from "../modelUtils/adjacentStopRemover";
import equipmentHelpers from "../modelUtils/equipmentHelpers";
import limitationHelpers from "../modelUtils/limitationHelpers";
import formatHelpers from "../modelUtils/mapToClient";
import SettingsManager from "../singletons/SettingsManager";
import { setDecimalPrecision } from "../utils/";
import { getStateByOperation } from "./stopPlaceReducerUtils";

const Settings = new SettingsManager();

const initialState = {
  centerPosition: [64.349421, 16.809082],
  zoom: 6,
  minZoom: 14,
  isCompassBearingEnabled: Settings.getShowCompassBearing(),
  isCreatingPolylines: false,
  enablePublicCodePrivateCodeOnStopPlaces:
    Settings.getEnablePublicCodePrivateCodeOnStopPlaces(),
  enablePolylines: Settings.getShowPathLinks(),
  showExpiredStops: Settings.getShowExpiredStops(),
  showMultimodalEdges: Settings.getShowMultimodalEdges(),
  lastMutatedStopPlaceId: [],
  isFetchingMergeInfo: false,
  loading: false,
};

const stopPlaceReducer = (state = initialState, action) => {
  switch (action.type) {
    /* These actions are dispatched by Apollo-Client */
    case types.APOLLO_QUERY_RESULT:
    case types.APOLLO_MUTATION_RESULT:
      return getStateByOperation(state, action);

    case types.CLEAR_SEARCH_RESULTS:
      return Object.assign({}, state, {
        searchResults: [],
      });

    case types.REMOVED_CHILD_FROM_PARENT_STOP_PLACE:
      return Object.assign({}, state, {
        current: formatHelpers.updateParenStopWithoutStopPlace(
          state.current,
          action.payload,
        ),
        stopHasBeenModified: true,
      });

    case types.ADDED_STOP_PLACES_TO_PARENT:
      return Object.assign({}, state, {
        current: formatHelpers.updateParentStopWithStopPlaces(
          state.current,
          action.payload,
        ),
        stopHasBeenModified: true,
      });

    case types.DESTROYED_NEW_STOP:
      return Object.assign({}, state, {
        newStop: null,
      });

    case types.NAVIGATE_TO_MAIN_AFTER_DELETE:
      return Object.assign({}, state, {
        searchResults: [],
        pathLink: [],
        current: null,
        stopHasBeenModified: false,
        activeSearchResult: null,
        versions: [],
        originalCurrent: null,
      });

    case types.HID_QUAYS_FOR_NEIGHBOUR_STOP:
      const id = action.payload;
      return Object.assign({}, state, {
        neighbourStopQuays: { ...state.neighbourStopQuays, [id]: null },
      });

    case types.RESTORED_TO_ORIGINAL_STOP_PLACE:
      return Object.assign({}, state, {
        stopHasBeenModified: false,
        current: JSON.parse(JSON.stringify(state.originalCurrent)),
        pathLink: JSON.parse(JSON.stringify(state.originalPathLink)),
      });

    case types.ADD_ADJACENT_SITE:
      const stopPlaceId1 = action.payload.stopPlaceId1;
      const stopPlaceId2 = action.payload.stopPlaceId2;
      AdjacentStopAdder.addAdjacentStopReference(
        state.current,
        stopPlaceId1,
        stopPlaceId2,
      );

      return Object.assign({}, state, {
        stopHasBeenModified: true,
      });

    case types.REMOVE_ADJACENT_SITE:
      const adjacentStopPlaceRef = action.payload.adjacentStopPlaceRef;
      const stopPlaceIdForRemovingAdjacentSite = action.payload.stopPlaceId;
      const changedStopPlace = AdjacentStopRemover.removeAdjacentStop(
        state.current,
        adjacentStopPlaceRef,
        stopPlaceIdForRemovingAdjacentSite,
      );

      return Object.assign({}, state, {
        stopHasBeenModified: true,
        current: changedStopPlace,
      });

    case types.SET_CENTER_AND_ZOOM:
      return Object.assign({}, state, {
        centerPosition: action.payload.position.slice(),
        zoom: action.payload.zoom,
      });

    case types.CLEAR_LAST_MUTATED_STOP_PLACE_IDS:
      return Object.assign({}, state, {
        lastMutatedStopPlaceId: [],
      });

    case types.NAVIGATE_TO:
      if (action.payload === "") {
        return Object.assign({}, state, {
          pathLink: [],
          current: null,
          newStop: null,
        });
      } else {
        return state;
      }

    case types.REMOVED_STOPS_NEARBY_FOR_OVERVIEW:
      return Object.assign({}, state, {
        neighbourStops: [],
      });

    case types.SORTED_QUAYS:
      return Object.assign({}, state, {
        current: formatHelpers.sortQuays(state.current, action.payload),
      });

    case types.LOOKUP_COORDINATES:
      return Object.assign({}, state, {
        findCoordinates: {
          position: action.payload.position.map((pos) =>
            setDecimalPrecision(pos, 6),
          ),
          coordinatePin: true,
        },
        centerPosition: action.payload.triggeredByDrag
          ? state.centerPosition
          : action.payload.position,
        zoom: action.payload.triggeredByDrag ? state.zoom : 5,
      });

    case types.CHANGED_WEIGHTING_STOP_PLACE:
      return Object.assign({}, state, {
        current: formatHelpers.updateCurrentStopWithWeighting(
          state.current,
          action.payload,
        ),
        stopHasBeenModified: true,
      });

    case types.CREATED_NEW_STOP:
      const { location, isMultimodal, locationPermissions } = action.payload;
      const stopToBeCreated = isMultimodal
        ? formatHelpers.createNewParentStopFromLocation(location)
        : formatHelpers.createNewStopFromLocation(location);

      return Object.assign({}, state, {
        newStop: {
          ...stopToBeCreated,
          permissions: locationPermissions,
        },
        originalCurrent: JSON.parse(JSON.stringify(stopToBeCreated)),
        versions: [],
        pathLink: [],
        newStopIsMultiModal: isMultimodal,
        stopHasBeenModified: false,
      });

    case types.CHANGED_QUAY_COMPASS_BEARING:
      return Object.assign({}, state, {
        current: formatHelpers.updateCompassBearing(
          state.current,
          action.payload,
        ),
        stopHasBeenModified: true,
      });

    case types.UPDATED_KEY_VALUES_FOR_KEY:
      return Object.assign({}, state, {
        current: formatHelpers.updateKeyValuesByKey(
          state.current,
          action.payload.key,
          action.payload.values,
          action.payload.origin,
        ),
        stopHasBeenModified: true,
      });

    case types.DELETED_KEY_VALUES_BY_KEY:
      return Object.assign({}, state, {
        current: formatHelpers.deleteKeyValuesByKey(
          state.current,
          action.payload.key,
          action.payload.origin,
        ),
        stopHasBeenModified: true,
      });

    case types.CREATED_KEY_VALUES_PAIR:
      return Object.assign({}, state, {
        current: formatHelpers.createKeyValuesPair(
          state.current,
          action.payload.key,
          action.payload.values,
          action.payload.origin,
        ),
        stopHasBeenModified: true,
      });

    case types.CHANGED_LOCATION_NEW_STOP:
      return Object.assign({}, state, {
        newStop: formatHelpers.createNewStopFromLocation(action.payload),
        stopHasBeenModified: true,
      });

    case types.CHANGED_STOP_NAME:
      return {
        ...state,
        current: {
          ...state.current,
          name: action.payload,
        },
        stopHasBeenModified: true,
      };

    case types.CHANGED_STOP_PUBLIC_CODE:
      return {
        ...state,
        current: {
          ...state.current,
          publicCode: action.payload,
        },
        stopHasBeenModified: true,
      };

    case types.CHANGED_STOP_PRIVATE_CODE:
      return {
        ...state,
        current: {
          ...state.current,
          privateCode: action.payload,
        },
        stopHasBeenModified: true,
      };

    case types.CHANGED_STOP_DESCRIPTION:
      return {
        ...state,
        current: {
          ...state.current,
          description: action.payload,
        },
        stopHasBeenModified: true,
      };

    case types.CHANGED_STOP_TYPE:
      return Object.assign({}, state, {
        current: formatHelpers.updateCurrentStopWithType(
          state.current,
          action.payload,
        ),
        stopHasBeenModified: true,
      });

    case types.CHANGED_STOP_SUBMODE:
      return Object.assign({}, state, {
        current: formatHelpers.updateCurrentStopWithSubMode(
          state.current,
          action.payload.stopPlaceType,
          action.payload.transportMode,
          action.payload.submode,
        ),
        stopHasBeenModified: true,
      });

    case types.CHANGED_ACTIVE_STOP_POSITION:
      return Object.assign({}, state, {
        current: formatHelpers.updateCurrentStopWithPosition(
          state.current,
          action.payload.location,
        ),
        stopHasBeenModified: true,
      });

    case types.USE_NEW_STOP_AS_CURRENT:
      return Object.assign({}, state, {
        current: JSON.parse(JSON.stringify(state.newStop)),
        centerPosition: state.newStop.location,
        isCreatingPolylines: false,
        zoom: 14,
        stopHasBeenModified: false,
        versions: [],
      });

    case types.CREATE_NEW_MULTIMODAL_STOP_FROM_EXISTING:
      const { newStopPlace, fromMain } = action.payload;
      let newState = Object.assign({}, state, {
        current: newStopPlace,
        isCreatingPolylines: false,
        stopHasBeenModified: true,
        versions: [],
      });
      if (!fromMain) {
        newState.centerPosition = newStopPlace.location;
      }
      return newState;

    case types.SET_ACTIVE_MARKER:
      return Object.assign({}, state, {
        activeSearchResult: action.payload,
        centerPosition: getProperCenterLocation(action.payload.location),
        zoom: getProperZoomLevel(action.payload.location),
      });

    case types.SET_MISSING_COORDINATES:
      return Object.assign({}, state, {
        centerPosition: getProperCenterLocation(action.payload.position),
        zoom: getProperZoomLevel(action.payload.position),
        userDefinedCoordinates: action.payload,
        activeSearchResult: Object.assign({}, state.activeSearchResult, {
          location: action.payload.position,
        }),
      });

    case types.ADDED_STOP_PLACE_ELEMENT:
      return Object.assign({}, state, {
        current: formatHelpers.updateCurrentWithNewElement(
          state.current,
          action.payload,
        ),
        stopHasBeenModified: true,
      });

    case types.CHANGE_ELEMENT_POSITION:
      return Object.assign({}, state, {
        current: formatHelpers.updateCurrentWithElementPositionChange(
          state.current,
          action.payload,
        ),
        stopHasBeenModified: true,
      });

    case types.CHANGE_PUBLIC_CODE_NAME:
      return Object.assign({}, state, {
        current: formatHelpers.updateCurrentWithPublicCode(
          state.current,
          action.payload,
        ),
        stopHasBeenModified: true,
      });

    case types.CHANGE_PRIVATE_CODE_NAME:
      return Object.assign({}, state, {
        current: formatHelpers.updateCurrentWithPrivateCode(
          state.current,
          action.payload,
        ),
        stopHasBeenModified: true,
      });

    case types.CHANGED_ELEMENT_DESCRIPTION:
      return Object.assign({}, state, {
        current: formatHelpers.updateCurrentWithElementDescriptionChange(
          state.current,
          action.payload,
        ),
        stopHasBeenModified: true,
      });

    case types.REMOVED_ELEMENT_BY_TYPE:
      return Object.assign({}, state, {
        current: formatHelpers.updateCurrentWithoutElement(
          state.current,
          action.payload,
        ),
        stopHasBeenModified: true,
      });

    case types.CHANGED_MAP_CENTER:
      return Object.assign({}, state, {
        centerPosition: action.payload.position,
        zoom: action.payload.zoom,
      });

    case types.STARTED_CREATING_POLYLINE:
      return Object.assign({}, state, {
        pathLink: formatHelpers.updatePathLinkWithNewEntry(
          action,
          state.pathLink,
        ),
        stopHasBeenModified: true,
        isCreatingPolylines: true,
        enablePolylines: true,
      });

    case types.ADDED_FINAL_COORDINATES_TO_POLYLINE:
      return Object.assign({}, state, {
        pathLink: formatHelpers.updatePathLinkWithNewEntry(
          action,
          state.pathLink,
        ),
        stopHasBeenModified: true,
        isCreatingPolylines: false,
      });

    case types.ADDED_COORDINATES_TO_POLYLINE:
      return Object.assign({}, state, {
        pathLink: formatHelpers.addNewPointToPathlink(action, state.pathLink),
        enablePolylines: true,
      });

    case types.REMOVED_LAST_POLYLINE:
      return Object.assign({}, state, {
        pathLink: state.pathLink.slice(0, state.pathLink.length - 1),
        isCreatingPolylines: false,
      });

    case types.EDITED_TIME_ESTIMATE_FOR_POLYLINE:
      return Object.assign({}, state, {
        pathLink: formatHelpers.updateEstimateForPathLink(
          action,
          state.pathLink,
        ),
      });

    case types.TOGGLED_ENABLE_PUBLIC_CODE_PRIVATE_CODE_ON_STOP_PLACES:
      return Object.assign({}, state, {
        enablePublicCodePrivateCodeOnStopPlaces: action.payload,
      });

    case types.TOGGLED_IS_MULTIPOLYLINES_ENABLED:
      return Object.assign({}, state, { enablePolylines: action.payload });

    case types.TOGGLED_IS_COMPASS_BEARING_ENABLED:
      return Object.assign({}, state, {
        isCompassBearingEnabled: action.payload,
      });

    case types.TOGGLED_IS_MULTIMODAL_EDGES_ENABLED:
      return Object.assign({}, state, {
        showMultimodalEdges: action.payload,
      });

    case types.CHANGED_STOP_ACCESSIBLITY_ASSESSMENT:
      return Object.assign({}, state, {
        current: limitationHelpers.updateCurrentWithLimitations(
          state.current,
          action.payload,
        ),
        stopHasBeenModified: true,
      });

    case types.CHANGED_QUAY_ACCESSIBLITY_ASSESSMENT:
      return Object.assign({}, state, {
        current: limitationHelpers.updateCurrentWithQuayLimitations(
          state.current,
          action.payload,
        ),
        stopHasBeenModified: true,
      });

    case types.CHANGED_TICKET_MACHINE_STATE:
      return Object.assign({}, state, {
        current: equipmentHelpers.updateTicketMachineState(
          state.current,
          action.payload,
        ),
        stopHasBeenModified: true,
      });

    case types.CHANGED_SHELTER_EQUIPMENT_STATE:
      return Object.assign({}, state, {
        current: equipmentHelpers.updateShelterEquipmentState(
          state.current,
          action.payload,
        ),
        stopHasBeenModified: true,
      });

    case types.CHANGED_SANITARY_EQUIPMENT_STATE:
      return Object.assign({}, state, {
        current: equipmentHelpers.updateSanitaryEquipmentState(
          state.current,
          action.payload,
        ),
        stopHasBeenModified: true,
      });

    case types.CHANGED_WAITING_ROOM_STATE:
      return Object.assign({}, state, {
        current: equipmentHelpers.updateWaitingRoomState(
          state.current,
          action.payload,
        ),
        stopHasBeenModified: true,
      });

    case types.CHANGED_CYCLE_STORAGE_STATE:
      return Object.assign({}, state, {
        current: equipmentHelpers.updateCycleStorageEquipmentState(
          state.current,
          action.payload,
        ),
        stopHasBeenModified: true,
      });

    case types.CHANGED_TRANSPORT_SIGN_STATE:
      return Object.assign({}, state, {
        current: equipmentHelpers.update512SignEquipment(
          state.current,
          action.payload,
        ),
        stopHasBeenModified: true,
      });

    case types.ADDED_ALT_NAME:
      return Object.assign({}, state, {
        current: formatHelpers.addAltName(state.current, action.payload),
        stopHasBeenModified: true,
      });

    case types.EDITED_ALT_NAME:
      return Object.assign({}, state, {
        current: formatHelpers.editAltName(state.current, action.payload),
        stopHasBeenModified: true,
      });

    case types.REMOVED_ALT_NAME:
      return Object.assign({}, state, {
        current: formatHelpers.removeAltName(state.current, action.payload),
        stopHasBeenModified: true,
      });

    case types.CHANGED_PARKING_NAME:
      return Object.assign({}, state, {
        current: formatHelpers.changeParkingName(state.current, action.payload),
        stopHasBeenModified: true,
      });

    case types.CHANGED_PARKING_LAYOUT:
      return Object.assign({}, state, {
        current: formatHelpers.changeParkingLayout(
          state.current,
          action.payload,
        ),
        stopHasBeenModified: true,
      });

    case types.CHANGED_PARKING_PAYMENT_PROCESS:
      return Object.assign({}, state, {
        current: formatHelpers.changeParkingPaymentProcess(
          state.current,
          action.payload,
        ),
        stopHasBeenModified: true,
      });

    case types.CHANGED_PARKING_RECHARGING_AVAILABLE:
      return Object.assign({}, state, {
        current: formatHelpers.changeParkingRechargingAvailable(
          state.current,
          action.payload,
        ),
        stopHasBeenModified: true,
      });

    case types.CHANGED_PARKING_NUMBER_OF_SPACES:
      return Object.assign({}, state, {
        current: formatHelpers.changeParkingNumberOfSpaces(
          state.current,
          action.payload,
        ),
        stopHasBeenModified: true,
      });

    case types.CHANGED_PARKING_NUMBER_OF_SPACES_WITH_RECHARGE_POINT:
      return Object.assign({}, state, {
        current: formatHelpers.changeParkingNumberOfSpacesWithRechargePoint(
          state.current,
          action.payload,
        ),
        stopHasBeenModified: true,
      });

    case types.CHANGED_PARKING_NUMBER_OF_SPACES_FOR_REGISTERED_DISABLED_USER_TYPE:
      return Object.assign({}, state, {
        current:
          formatHelpers.changeParkingNumberOfSpacesForRegisteredDisabledUserType(
            state.current,
            action.payload,
          ),
        stopHasBeenModified: true,
      });

    case types.CHANGED_PARKING_TOTAL_CAPACITY:
      return Object.assign({}, state, {
        current: formatHelpers.changeParkingTotalCapacity(
          state.current,
          action.payload,
        ),
        stopHasBeenModified: true,
      });

    case types.OPENED_MERGE_STOP_DIALOG:
      return Object.assign({}, state, {
        mergeStopDialog: {
          isOpen: true,
          ...action.payload,
        },
      });

    case types.REQUESTED_QUAYS_MERGE_INFO:
      return Object.assign({}, state, {
        isFetchingMergeInfo: true,
      });

    case types.RECEIVED_QUAYS_MERGE_INFO:
      return Object.assign({}, state, {
        isFetchingMergeInfo: false,
      });

    case types.CLOSED_MERGE_STOP_DIALOG:
      return Object.assign({}, state, {
        mergeStopDialog: {
          isOpen: false,
        },
      });

    case types.TOGGLED_IS_SHOW_EXPIRED_STOPS:
      return Object.assign({}, state, {
        showExpiredStops: action.payload,
      });

    case types.SET_STOP_PLACE_LOADING:
      return Object.assign({}, state, {
        loading: action.payload,
      });

    default:
      return state;
  }
};

const getProperCenterLocation = (location) => {
  return location || [62.928595, 12.083002];
};

const getProperZoomLevel = (location) => {
  return location ? 15 : 5;
};

export default stopPlaceReducer;
