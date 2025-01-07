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

import { createThunk, UserActions } from ".";
import { Entities } from "../models/Entities";
import { getCentroid } from "../utils/mapUtils";
import { updateURLWithId } from "../utils/URLhelpers";
import { getLocationPermissionsForCoordinates } from "./TiamatActions";
import * as types from "./Types";

var StopPlaceActions = {};

StopPlaceActions.removeChildFromParentStopPlace =
  (stopPlaceId) => (dispatch) => {
    dispatch(
      createThunk(types.REMOVED_CHILD_FROM_PARENT_STOP_PLACE, stopPlaceId),
    );
  };

StopPlaceActions.addChildrenToParenStopPlace =
  ({ data }) =>
  (dispatch, getState) => {
    // extract stopPlaces from query result
    let foundStopPlaces = [];

    Object.values(data).forEach(
      (entry) => (foundStopPlaces = foundStopPlaces.concat(entry[0])),
    );

    const state = getState();
    // Do not append children already added
    const alreadyAdded = state.stopPlace.current.children.map(
      (child) => child.id,
    );
    const toAdd = foundStopPlaces
      .filter((item) => alreadyAdded.indexOf(item.id) === -1)
      .map((item) => ({ ...item, notSaved: true }));

    dispatch(createThunk(types.ADDED_STOP_PLACES_TO_PARENT, toAdd));
  };

StopPlaceActions.changeLocationNewStop = (location) => (dispatch) => {
  dispatch(
    createThunk(types.CHANGED_LOCATION_NEW_STOP, [location.lat, location.lng]),
  );
};

StopPlaceActions.sortQuays = (attribute) => (dispatch) => {
  dispatch(createThunk(types.SORTED_QUAYS, attribute));
};

StopPlaceActions.useNewStopAsCurrent = () => (dispatch) => {
  dispatch(createThunk(types.USE_NEW_STOP_AS_CURRENT, location));
};

StopPlaceActions.changeStopName = (name) => (dispatch) => {
  dispatch(createThunk(types.CHANGED_STOP_NAME, name));
};

StopPlaceActions.changeStopPublicCode = (publicCode) => (dispatch) => {
  dispatch(createThunk(types.CHANGED_STOP_PUBLIC_CODE, publicCode));
};

StopPlaceActions.changeStopPrivateCode = (privateCode) => (dispatch) => {
  dispatch(createThunk(types.CHANGED_STOP_PRIVATE_CODE, privateCode));
};

StopPlaceActions.changeStopDescription = (description) => (dispatch) => {
  dispatch(createThunk(types.CHANGED_STOP_DESCRIPTION, description));
};

StopPlaceActions.changeStopType = (type) => (dispatch) => {
  if (type === "busStation") {
    dispatch(
      createThunk(types.CHANGED_STOP_SUBMODE, {
        stopPlaceType: type,
        transportMode: "bus",
        submode: null,
      }),
    );
  } else {
    dispatch(createThunk(types.CHANGED_STOP_TYPE, type));
  }
};

StopPlaceActions.changeSubmode =
  (stopPlaceType, transportMode, submode) => (dispatch) => {
    dispatch(
      createThunk(types.CHANGED_STOP_SUBMODE, {
        stopPlaceType,
        transportMode,
        submode,
      }),
    );
  };

StopPlaceActions.updateKeyValuesForKey =
  (key, values) => (dispatch, getState) => {
    let state = getState();
    let origin = state.user.keyValuesOrigin;

    dispatch(
      createThunk(types.UPDATED_KEY_VALUES_FOR_KEY, {
        key,
        values,
        origin,
      }),
    );
  };

StopPlaceActions.deleteKeyValuesByKey = (key) => (dispatch, getState) => {
  let state = getState();
  let origin = state.user.keyValuesOrigin;

  dispatch(
    createThunk(types.DELETED_KEY_VALUES_BY_KEY, {
      key,
      origin,
    }),
  );
};

StopPlaceActions.createKeyValuesPair =
  (key, values) => (dispatch, getState) => {
    let state = getState();
    let origin = state.user.keyValuesOrigin;

    dispatch(
      createThunk(types.CREATED_KEY_VALUES_PAIR, {
        key,
        values,
        origin,
      }),
    );
  };

StopPlaceActions.setMarkerOnMap = (data) => (dispatch, getState) => {
  dispatch(
    createThunk(
      types.SET_ACTIVE_MARKER,
      Object.assign({}, data, { isActive: true }),
    ),
  );

  const { location } = data;
  if (location) {
    dispatch(getLocationPermissionsForCoordinates(location[0], location[1]));
  }

  if (data.entityType === Entities.STOP_PLACE) {
    updateURLWithId("stopPlaceId", data.id);
  } else if (data.entityType === Entities.GROUP_OF_STOP_PLACE) {
    updateURLWithId("groupOfStopPlacesId", data.id);
  } else {
    console.error(
      "entityType not found",
      data.entityType,
      ", will not update URL",
    );
  }
};

StopPlaceActions.changeMapCenter = (position, zoom) => (dispatch) => {
  dispatch(
    createThunk(types.CHANGED_MAP_CENTER, {
      position,
      zoom,
    }),
  );
};

StopPlaceActions.addAltName = (payload) => (dispatch) => {
  dispatch(createThunk(types.ADDED_ALT_NAME, payload));
};

StopPlaceActions.editAltName = (payload) => (dispatch) => {
  dispatch(createThunk(types.EDITED_ALT_NAME, payload));
};

StopPlaceActions.removeAltName = (index) => (dispatch) => {
  dispatch(createThunk(types.REMOVED_ALT_NAME, index));
};

StopPlaceActions.removeElementByType = (index, type) => (dispatch) => {
  dispatch(
    createThunk(types.REMOVED_ELEMENT_BY_TYPE, {
      index: index,
      type: type,
    }),
  );
};

StopPlaceActions.removeBoardingPositionElement =
  (index, quayIndex) => (dispatch) => {
    dispatch(
      createThunk(types.REMOVED_ELEMENT_BY_TYPE, {
        index,
        quayIndex,
        type: "boarding-position",
      }),
    );
  };

StopPlaceActions.changePublicCodeName = (index, name, type) => (dispatch) => {
  dispatch(
    createThunk(types.CHANGE_PUBLIC_CODE_NAME, {
      name: name,
      index: index,
      type: type,
    }),
  );
};

StopPlaceActions.changeBoardingPositionPublicCode =
  (index, quayIndex, name) => (dispatch) => {
    dispatch(
      createThunk(types.CHANGE_PUBLIC_CODE_NAME, {
        name,
        index,
        quayIndex,
        type: "boarding-position",
      }),
    );
  };

StopPlaceActions.changePrivateCodeName = (index, name, type) => (dispatch) => {
  dispatch(
    createThunk(types.CHANGE_PRIVATE_CODE_NAME, {
      name: name,
      index: index,
      type: type,
    }),
  );
};

StopPlaceActions.changeCurrentStopPosition = (position) => (dispatch) => {
  dispatch(
    createThunk(types.CHANGED_ACTIVE_STOP_POSITION, {
      location: position,
    }),
  );
};

StopPlaceActions.changeWeightingForStop = (value) => (dispatch) => {
  dispatch(createThunk(types.CHANGED_WEIGHTING_STOP_PLACE, value));
};

StopPlaceActions.changeElementDescription =
  (index, description, type) => (dispatch) => {
    dispatch(
      createThunk(types.CHANGED_ELEMENT_DESCRIPTION, {
        index: index,
        description: description,
        type: type,
      }),
    );
  };

StopPlaceActions.changeQuayCompassBearing =
  (index, compassBearing) => (dispatch) => {
    dispatch(
      createThunk(types.CHANGED_QUAY_COMPASS_BEARING, {
        index,
        compassBearing,
      }),
    );
  };

StopPlaceActions.setElementFocus = (index, type) => (dispatch, getState) => {
  let state = getState();
  let keyValuesDialogOpen = state.user.keyValuesDialogOpen;
  let keyValuesOrigin = state.user.keyValuesOrigin;

  if (
    index > -1 &&
    type === "quay" &&
    keyValuesDialogOpen &&
    keyValuesOrigin &&
    keyValuesOrigin.type === "quay"
  ) {
    dispatch(UserActions.closeKeyValuesDialog());
  }

  dispatch(UserActions.changeElementTypeTabByType(type));

  dispatch(
    createThunk(types.SET_FOCUS_ON_ELEMENT, {
      index: index,
      type: type,
    }),
  );
};

StopPlaceActions.setBoardingPositionElementFocus =
  (index, quayIndex) => (dispatch) => {
    dispatch(StopPlaceActions.setElementFocus(quayIndex, "quay"));

    dispatch(
      createThunk(types.SET_FOCUS_ON_BOARDING_POSITION_ELEMENT, {
        index,
        quayIndex,
      }),
    );

    dispatch(createThunk(types.SHOW_EDIT_QUAY_ADDITIONAL, null));

    dispatch(
      UserActions.changeQuayAdditionalTypeTabByType("boarding-positions"),
    );
  };

StopPlaceActions.createNewStop = (location) => (dispatch, getState) => {
  const state = getState();
  const isMultimodal = state.user.newStopIsMultiModal;
  dispatch(
    createThunk(types.CREATED_NEW_STOP, {
      isMultimodal,
      location: [Number(location.lat), Number(location.lng)],
    }),
  );
};

StopPlaceActions.discardChangesForEditingStop = () => (dispatch) => {
  dispatch(createThunk(types.RESTORED_TO_ORIGINAL_STOP_PLACE, null));
};

StopPlaceActions.setActiveMap = (map) => (dispatch) => {
  dispatch(createThunk(types.SET_ACTIVE_MAP, map));
};

StopPlaceActions.addElementToStop =
  (type, position) => (dispatch, getState) => {
    if (type === "stop_place") {
      dispatch(
        createThunk(types.CHANGED_ACTIVE_STOP_POSITION, {
          location: position,
        }),
      );
    } else {
      dispatch(
        createThunk(types.ADDED_STOP_PLACE_ELEMENT, {
          type,
          position,
          focusedElement: getState().mapUtils.focusedElement,
        }),
      );
    }
  };

StopPlaceActions.changeElementPosition =
  (coordinatesOwner, position) => (dispatch) => {
    dispatch(
      createThunk(types.CHANGE_ELEMENT_POSITION, {
        ...coordinatesOwner,
        position,
      }),
    );
  };

StopPlaceActions.changeParkingTotalCapacity =
  (index, totalCapacity) => (dispatch) => {
    dispatch(
      createThunk(types.CHANGED_PARKING_TOTAL_CAPACITY, {
        index,
        totalCapacity,
      }),
    );
  };

StopPlaceActions.changeParkingName = (index, name) => (dispatch) => {
  dispatch(
    createThunk(types.CHANGED_PARKING_NAME, {
      index,
      name,
    }),
  );
};

StopPlaceActions.changeParkingLayout = (index, parkingLayout) => (dispatch) => {
  dispatch(
    createThunk(types.CHANGED_PARKING_LAYOUT, {
      index,
      parkingLayout,
    }),
  );
};

StopPlaceActions.changeParkingPaymentProcess =
  (index, parkingPaymentProcess) => (dispatch) => {
    dispatch(
      createThunk(types.CHANGED_PARKING_PAYMENT_PROCESS, {
        index,
        parkingPaymentProcess,
      }),
    );
  };

StopPlaceActions.changeParkingRechargingAvailable =
  (index, rechargingAvailable) => (dispatch) => {
    dispatch(
      createThunk(types.CHANGED_PARKING_RECHARGING_AVAILABLE, {
        index,
        rechargingAvailable,
      }),
    );
  };

StopPlaceActions.changeParkingNumberOfSpaces =
  (index, numberOfSpaces) => (dispatch) => {
    dispatch(
      createThunk(types.CHANGED_PARKING_NUMBER_OF_SPACES, {
        index,
        numberOfSpaces,
      }),
    );
  };

StopPlaceActions.changeParkingNumberOfSpacesWithRechargePoint =
  (index, numberOfSpacesWithRechargePoint) => (dispatch) => {
    dispatch(
      createThunk(types.CHANGED_PARKING_NUMBER_OF_SPACES_WITH_RECHARGE_POINT, {
        index,
        numberOfSpacesWithRechargePoint,
      }),
    );
  };

StopPlaceActions.changeParkingNumberOfSpacesForRegisteredDisabledUserType =
  (index, numberOfSpacesForRegisteredDisabledUserType) => (dispatch) => {
    dispatch(
      createThunk(
        types.CHANGED_PARKING_NUMBER_OF_SPACES_FOR_REGISTERED_DISABLED_USER_TYPE,
        {
          index,
          numberOfSpacesForRegisteredDisabledUserType,
        },
      ),
    );
  };

StopPlaceActions.clearLastMutatedStopPlaceId = () => (dispatch) => {
  dispatch(createThunk(types.CLEAR_LAST_MUTATED_STOP_PLACE_IDS, null));
};

StopPlaceActions.addAdjacentConnection =
  (stopPlaceId1, stopPlaceId2) => (dispatch) => {
    dispatch(
      createThunk(types.ADD_ADJACENT_SITE, { stopPlaceId1, stopPlaceId2 }),
    );
  };

StopPlaceActions.removeAdjacentConnection =
  (stopPlaceId, adjacentStopPlaceRef) => (dispatch) => {
    dispatch(
      createThunk(types.REMOVE_ADJACENT_SITE, {
        stopPlaceId,
        adjacentStopPlaceRef,
      }),
    );
  };

StopPlaceActions.adjustCentroid = () => (dispatch, getState) => {
  const state = getState();
  const stopPlace = state.stopPlace.current;
  let centroid = null;

  // adjust by childrens' location
  if (stopPlace.isParent) {
    let latlngs = stopPlace.children.map((child) => child.location);
    centroid = getCentroid(latlngs, stopPlace.location);
  } else {
    let latlngs = stopPlace.quays.map((quay) => quay.location);
    centroid = getCentroid(latlngs, stopPlace.location);
  }
  dispatch(StopPlaceActions.changeCurrentStopPosition(centroid));
  dispatch(UserActions.setCenterAndZoom(centroid, null));
};

StopPlaceActions.setStopPlaceLoading = (state) => (dispatch) => {
  dispatch(createThunk(types.SET_STOP_PLACE_LOADING, state));
};

export default StopPlaceActions;
