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

import { push } from "redux-first-history";
import {
  getAddStopPlaceInfo,
  getLocationPermissionsForCoordinates,
  getMergeInfoForStops,
  getUserPermissions,
} from "../actions/TiamatActions";
import { checkQuayUsage, checkStopPlaceUsage } from "../graphql/OTP/actions";
import configureLocalization from "../localization/localization";
import ParentStopPlace from "../models/ParentStopPlace";
import Routes from "../routes/";
import FavoriteManager from "../singletons/FavoriteManager";
import SettingsManager from "../singletons/SettingsManager";
import { getIn } from "../utils/";
import { createThunk } from "./";
import * as types from "./Types";

var UserActions = {};

let Settings = new SettingsManager();

const goToRoute = (dispatch, path, id) => {
  const basePath = "/";
  if (path.length && path[0] === "/") {
    path = path.slice(1);
  }
  dispatch(push(basePath + path + id));
};

UserActions.navigateTo = (path, id) => (dispatch) => {
  dispatch(createThunk(types.NAVIGATE_TO, id));
  goToRoute(dispatch, path, id);
};

UserActions.toggleShowFutureAndExpired = (value) => (dispatch) => {
  dispatch(createThunk(types.TOGGLE_SHOW_FUTURE_AND_EXPIRED, value));
};

UserActions.navigateToMainAfterDelete = () => (dispatch) => {
  dispatch(createThunk(types.NAVIGATE_TO_MAIN_AFTER_DELETE, null));
  goToRoute(dispatch, "/", "");
};

UserActions.closeLookupCoordinatesDialog = () => (dispatch) => {
  dispatch(createThunk(types.CLOSED_LOOKUP_COORDINATES_DIALOG, null));
};

UserActions.openLookupCoordinatesDialog = () => (dispatch) => {
  dispatch(createThunk(types.OPEN_LOOKUP_COORDINATES_DIALOG, null));
};

UserActions.openSuccessfullyCreatedNewStop = (stopPlaceId) => (dispatch) => {
  dispatch(createThunk(types.SHOW_CREATED_NEW_STOP_INFO, stopPlaceId));
};

UserActions.closeSuccessfullyCreatedNewStop = () => (dispatch) => {
  dispatch(createThunk(types.HIDE_CREATED_NEW_STOP_INFO, null));
};

UserActions.clearSearchResults = () => (dispatch) => {
  dispatch(createThunk(types.CLEAR_SEARCH_RESULTS, null));
};

UserActions.hideEditStopAdditional = () => (dispatch) => {
  dispatch(createThunk(types.HID_EDIT_STOP_ADDITIONAL, null));
};

UserActions.showEditStopAdditional = () => (dispatch) => {
  dispatch(createThunk(types.SHOW_EDIT_STOP_ADDITIONAL, null));
};

UserActions.hideEditQuayAdditional = () => (dispatch) => {
  dispatch(createThunk(types.HIDE_EDIT_QUAY_ADDITIONAL, null));
};

UserActions.showEditQuayAdditional = () => (dispatch) => {
  dispatch(createThunk(types.SHOW_EDIT_QUAY_ADDITIONAL, null));
};

UserActions.toggleIsCreatingNewStop =
  (isMultiModal) => (dispatch, getState) => {
    const state = getState();
    const isCreatingNewStop = state.user.isCreatingNewStop;

    if (isCreatingNewStop) {
      dispatch(createThunk(types.DESTROYED_NEW_STOP, null));
    }
    dispatch(createThunk(types.TOGGLED_IS_CREATING_NEW_STOP, isMultiModal));
  };

UserActions.toggleMultimodalEdges = (value) => (dispatch) => {
  Settings.setShowMultimodalEdges(value);
  dispatch(createThunk(types.TOGGLED_IS_MULTIMODAL_EDGES_ENABLED, value));
};

UserActions.toggleEnablePublicCodePrivateCodeOnStopPlaces =
  (value) => (dispatch) => {
    Settings.setEnablePublicCodePrivateCodeOnStopPlaces(value);
    dispatch(
      createThunk(
        types.TOGGLED_ENABLE_PUBLIC_CODE_PRIVATE_CODE_ON_STOP_PLACES,
        value,
      ),
    );
  };

UserActions.togglePathLinksEnabled = (value) => (dispatch) => {
  Settings.setShowPathLinks(value);
  dispatch(createThunk(types.TOGGLED_IS_MULTIPOLYLINES_ENABLED, value));
};

UserActions.toggleCompassBearingEnabled = (value) => (dispatch) => {
  Settings.setShowCompassBearing(value);
  dispatch(createThunk(types.TOGGLED_IS_COMPASS_BEARING_ENABLED, value));
};

UserActions.toggleExpiredShowExpiredStops = (value) => (dispatch) => {
  Settings.setShowExpiredStops(value);
  dispatch(createThunk(types.TOGGLED_IS_SHOW_EXPIRED_STOPS, value));
};

UserActions.applyStopTypeSearchFilter = (filters) => (dispatch) => {
  dispatch(createThunk(types.APPLIED_STOPTYPE_SEARCH_FILTER, filters));
};

UserActions.openSnackbar = (status) => (dispatch) => {
  dispatch(createThunk(types.OPENED_SNACKBAR, { status }));
};

UserActions.dismissSnackbar = () => (dispatch) => {
  dispatch(createThunk(types.DISMISSED_SNACKBAR, null));
};

UserActions.applyLocale = (locale) => (dispatch) => {
  dispatch(createThunk(types.APPLIED_LOCALE, locale));
  configureLocalization(locale).then((localization) => {
    dispatch(UserActions.changeLocalization(localization));
  });
};

UserActions.changeLocalization = (localization) => (dispatch) => {
  dispatch(createThunk(types.CHANGED_LOCALIZATION, localization));
};

UserActions.hideQuaysForNeighbourStop = (id) => (dispatch) => {
  dispatch(createThunk(types.HID_QUAYS_FOR_NEIGHBOUR_STOP, id));
};

UserActions.addToposChip = (chip) => (dispatch) => {
  if (typeof chip.text !== "undefined" && typeof chip.type !== "undefined")
    dispatch(createThunk(types.ADDED_TOPOS_CHIP, chip));
};

UserActions.setToposchips = (chips) => (dispatch) => {
  dispatch(createThunk(types.SET_TOPOS_CHIPS, chips));
};

UserActions.setStopPlaceTypes = (stopPlaces) => (dispatch) => {
  dispatch(createThunk(types.SET_STOP_PLACE_TYPES, stopPlaces));
};

UserActions.deleteChip = (key) => (dispatch) => {
  dispatch(createThunk(types.DELETED_TOPOS_CHIP, key));
};

UserActions.setCenterAndZoom = (position, zoom) => (dispatch, getState) => {
  const state = getState();
  let newZoom = zoom || state.stopPlace.zoom;
  dispatch(createThunk(types.SET_CENTER_AND_ZOOM, { position, zoom: newZoom }));
};

UserActions.saveSearchAsFavorite = (title) => (dispatch, getState) => {
  const state = getState();
  const searchFilters = state.user.searchFilters;
  let favoriteManager = new FavoriteManager();
  let savableContent = favoriteManager.createSavableContent(
    title,
    searchFilters.text,
    searchFilters.stopType,
    searchFilters.topoiChips,
    searchFilters.showFutureAndExpired,
  );
  favoriteManager.save(savableContent);
  dispatch(UserActions.closeFavoriteNameDialog());
};

UserActions.removeSearchAsFavorite = (item) => (dispatch) => {
  let favoriteManager = new FavoriteManager();
  favoriteManager.remove(item);
  dispatch(createThunk(types.REMOVE_SEARCH_AS_FAVORITE, item));
};

UserActions.setSearchText = (text) => (dispatch) => {
  dispatch(createThunk(types.SET_SEARCH_TEXT, text));
};

UserActions.setMissingCoordinates = (position, stopPlaceId) => (dispatch) => {
  dispatch(
    createThunk(types.SET_MISSING_COORDINATES, {
      stopPlaceId,
      position,
    }),
  );
};

UserActions.loadFavoriteSearch = (favorite) => (dispatch) => {
  dispatch(UserActions.setToposchips(favorite.topoiChips));
  dispatch(UserActions.setStopPlaceTypes(favorite.stopType));
  dispatch(UserActions.setSearchText(favorite.searchText));
  dispatch(
    UserActions.toggleShowFutureAndExpired(favorite.showFutureAndExpired),
  );
};

UserActions.openFavoriteNameDialog = () => (dispatch) => {
  dispatch(createThunk(types.OPENED_FAVORITE_NAME_DIALOG, null));
};

UserActions.closeFavoriteNameDialog = () => (dispatch) => {
  dispatch(createThunk(types.CLOSED_FAVORITE_NAME_DIALOG, null));
};

UserActions.changeActiveBaselayer = (layer) => (dispatch) => {
  Settings.setMapLayer(layer);
  dispatch(createThunk(types.CHANGED_ACTIVE_BASELAYER, layer));
};

UserActions.removeStopsNearbyForOverview = () => (dispatch) => {
  dispatch(createThunk(types.REMOVED_STOPS_NEARBY_FOR_OVERVIEW, null));
};

UserActions.startCreatingPolyline = (coordinates, id, type) => (dispatch) => {
  dispatch(
    createThunk(types.STARTED_CREATING_POLYLINE, {
      coordinates: coordinates,
      id: id,
      type: type,
    }),
  );
};

UserActions.removeAllFilters = () => (dispatch) => {
  dispatch(createThunk(types.REMOVED_ALL_FILTERS, null));
};

UserActions.addCoordinatesToPolylines = (coords) => (dispatch) => {
  dispatch(createThunk(types.ADDED_COORDINATES_TO_POLYLINE, coords));
};

UserActions.addFinalCoordinesToPolylines = (coords, id, type) => (dispatch) => {
  dispatch(
    createThunk(types.ADDED_FINAL_COORDINATES_TO_POLYLINE, {
      coordinates: coords,
      id: id,
      type: type,
    }),
  );
};

UserActions.removePolylineFromIndex = (index) => (dispatch) => {
  dispatch(createThunk(types.REMOVED_POLYLINE_FROM_INDEX, index));
};

UserActions.removeLastPolyline = () => (dispatch) => {
  dispatch(createThunk(types.REMOVED_LAST_POLYLINE, null));
};

UserActions.editPolylineTimeEstimate = (index, seconds) => (dispatch) => {
  dispatch(
    createThunk(types.EDITED_TIME_ESTIMATE_FOR_POLYLINE, {
      index: index,
      estimate: seconds,
    }),
  );
};

UserActions.changeElementTypeTab = (value) => (dispatch) => {
  dispatch(createThunk(types.CHANGED_ELEMENT_TYPE_TAB, value));
};

UserActions.changeElementTypeTabByType = (type) => (dispatch) => {
  let typesMap = {
    quay: 0,
    parking: 1,
  };
  let value = typesMap[type] || 0;
  dispatch(UserActions.changeElementTypeTab(value));
};

UserActions.changeQuayAdditionalTypeTab = (value) => (dispatch) => {
  dispatch(createThunk(types.CHANGED_QUAY_ADDITIONAL_TAB, value));
};

UserActions.changeQuayAdditionalTypeTabByType = (type) => (dispatch) => {
  let typesMap = {
    accessibility: 0,
    facilities: 1,
    "boarding-positions": 2,
  };
  let value = typesMap[type] || 0;
  dispatch(UserActions.changeQuayAdditionalTypeTab(value));
};

UserActions.showMergeStopDialog =
  (fromStopPlaceID, name) => (dispatch, getState) => {
    dispatch(
      createThunk(types.OPENED_MERGE_STOP_DIALOG, {
        id: fromStopPlaceID,
        name: name,
      }),
    );

    dispatch(createThunk(types.REQUESTED_QUAYS_MERGE_INFO, null));

    dispatch(getMergeInfoForStops(fromStopPlaceID))
      .then((response) => {
        dispatch(createThunk(types.RECEIVED_QUAYS_MERGE_INFO, null));
        dispatch(
          createThunk(types.OPENED_MERGE_STOP_DIALOG, {
            id: fromStopPlaceID,
            name,
            quays: getQuaysForMergeInfo(response.data.stopPlace),
          }),
        );
      })
      .catch((err) => {
        dispatch(createThunk(types.RECEIVED_QUAYS_MERGE_INFO, null));
        console.log(err);
      });
  };

UserActions.hideMergeStopDialog = () => (dispatch) => {
  dispatch(createThunk(types.CLOSED_MERGE_STOP_DIALOG, null));
};

UserActions.showAddAdjacentStopDialog = (stopPlaceId) => (dispatch) => {
  dispatch(createThunk(types.REQUESTED_ADJACENT_SITE_DIALOG, stopPlaceId));
};

UserActions.hideAddAdjacentStopDialog = () => (dispatch) => {
  dispatch(createThunk(types.CLOSED_ADJACENT_SITE_DIALOG, null));
};

UserActions.hideMergeQuaysDialog = () => (dispatch) => {
  dispatch(createThunk(types.CLOSED_MERGE_QUAYS_DIALOG, null));
};

UserActions.startMergingQuayFrom = (id) => (dispatch, getState) => {
  const state = getState();
  const quays = state.stopPlace.current.quays;
  const quay = getQuayById(quays, id);
  dispatch(createThunk(types.STARTED_MERGING_QUAY_FROM, quay));
};

UserActions.endMergingQuayTo = (id) => (dispatch, getState) => {
  const state = getState();
  const quays = state.stopPlace.current.quays;
  const quay = getQuayById(quays, id);
  dispatch(createThunk(types.ENDED_MERGING_QUAY_TO, quay));

  const fromQuayId = state.mapUtils.mergingQuay.fromQuay.id;

  checkQuayUsage(fromQuayId)
    .then(({ data }) => {
      if (data.quay && data.quay.lines) {
        let authorities = new Set();
        let serviceJourneyActiveDates = new Set();

        data.quay.lines.forEach((line) => {
          if (line.authority && line.authority.name) {
            authorities.add(line.authority.name);
          }
          line.serviceJourneys.forEach((sj) => {
            sj.activeDates.forEach((activeDateString) => {
              serviceJourneyActiveDates.add(activeDateString);
            });
          });
        });

        dispatch(
          createThunk(types.GET_QUAY_MERGE_OTP_INFO, {
            authorities: Array.from(authorities),
            warning: serviceJourneyActiveDates.size > 0,
          }),
        );
      } else {
        dispatch(
          createThunk(types.GET_QUAY_MERGE_OTP_INFO, {
            authorities: [],
            warning: 0,
          }),
        );
      }
    })
    .catch(() => {
      dispatch(createThunk(types.ERROR_QUAY_MERGE_OTP_INFO, null));
    });
};

UserActions.cancelMergingQuayFrom = () => (dispatch) => {
  dispatch(createThunk(types.CANCELLED_MERGING_QUAY_FROM, null));
};

UserActions.hideDeleteQuayDialog = () => (dispatch) => {
  dispatch(createThunk(types.CANCELLED_DELETE_QUAY_DIALOG, null));
};

UserActions.hideDeleteStopDialog = () => (dispatch) => {
  dispatch(createThunk(types.CANCELLED_DELETE_STOP_DIALOG, null));
};

UserActions.requestDeleteQuay =
  (stopPlaceId, quayId, importedId) => (dispatch) => {
    const source = {
      stopPlaceId,
      quayId,
    };

    dispatch(
      createThunk(types.REQUESTED_DELETE_QUAY, {
        source,
        importedId,
      }),
    );

    checkQuayUsage(quayId)
      .then(({ data }) => {
        if (data.quay && data.quay.lines) {
          let authorities = new Set();
          let serviceJourneyActiveDates = new Set();

          data.quay.lines.forEach((line) => {
            if (line.authority && line.authority.name) {
              authorities.add(line.authority.name);
            }
            line.serviceJourneys.forEach((sj) => {
              sj.activeDates.forEach((activeDateString) => {
                serviceJourneyActiveDates.add(activeDateString);
              });
            });
          });

          dispatch(
            createThunk(types.GET_QUAY_DELETE_OTP_INFO, {
              authorities: Array.from(authorities),
              warning: serviceJourneyActiveDates.size > 0,
            }),
          );
        } else {
          dispatch(
            createThunk(types.GET_QUAY_DELETE_OTP_INFO, {
              authorities: [],
              warning: 0,
            }),
          );
        }
      })
      .catch(() => {
        dispatch(createThunk(types.ERROR_QUAY_DELETE_OTP_INFO, null));
      });
  };

const formatStopPlaceUsageDetails = (stopPlace) => {
  if (stopPlace) {
    let serviceJourneyActiveDates = new Set();
    let authorities = new Set();
    let latestActiveDate = null;

    stopPlace.quays.forEach((quay) => {
      quay.lines.forEach((line) => {
        if (line.authority && line.authority.name) {
          authorities.add(line.authority.name);
        }

        line.serviceJourneys.forEach((sj) => {
          sj.activeDates.forEach((activeDateString) => {
            serviceJourneyActiveDates.add(activeDateString);
            const activeDateTime = new Date(activeDateString);
            if (latestActiveDate === null) {
              latestActiveDate = activeDateTime;
            } else {
              if (activeDateTime > latestActiveDate) {
                latestActiveDate = activeDateTime;
              }
            }
          });
        });
      });
    });
    return {
      serviceJourneyActiveDates,
      authorities,
      latestActiveDate,
    };
  }
  return null;
};

UserActions.requestTerminateStopPlace = (stopPlaceId) => (dispatch) => {
  dispatch(createThunk(types.TERMINATE_DELETE_STOP_DIALOG, null));
  if (stopPlaceId) {
    dispatch(
      createThunk(types.TERMINATE_DELETE_STOP_DIALOG_WARNING, {
        warning: 0,
        loading: true,
        error: false,
        activeDatesSize: 0,
        latestActiveDate: null,
        stopPlaceId,
      }),
    );

    checkStopPlaceUsage(stopPlaceId)
      .then(({ data }) => {
        if (data.stopPlace) {
          const { serviceJourneyActiveDates, authorities, latestActiveDate } =
            formatStopPlaceUsageDetails(data.stopPlace);

          dispatch(
            createThunk(types.TERMINATE_DELETE_STOP_DIALOG_WARNING, {
              warning: serviceJourneyActiveDates.size > 0,
              authorities: Array.from(authorities),
              loading: false,
              error: false,
              activeDatesSize: serviceJourneyActiveDates.size,
              latestActiveDate,
              stopPlaceId,
            }),
          );
        } else {
          // i.e. stop place is not in OTP, and returns null
          dispatch(
            createThunk(types.TERMINATE_DELETE_STOP_DIALOG_WARNING, {
              warning: false,
              loading: false,
              error: false,
              activeDatesSize: null,
              latestActiveDate: null,
              stopPlaceId,
            }),
          );
        }
      })
      .catch(() => {
        dispatch(
          createThunk(types.TERMINATE_DELETE_STOP_DIALOG_WARNING, {
            warning: false,
            loading: false,
            error: true,
            activeDatesSize: 0,
            latestActiveDate: null,
            stopPlaceId,
          }),
        );
      });
  }
};

UserActions.closeMoveQuayDialog = () => (dispatch) => {
  dispatch(createThunk(types.CANCELLED_MOVE_QUAY_DIALOG, null));
};

UserActions.openKeyValuesDialog = (keyValues, type, index) => (dispatch) => {
  dispatch(
    createThunk(types.OPENED_KEY_VALUES_DIALOG, {
      keyValues,
      type,
      index,
    }),
  );
};

UserActions.closeKeyValuesDialog = () => (dispatch) => {
  dispatch(createThunk(types.CLOSED_KEY_VALUES_DIALOG, null));
};

UserActions.moveQuay = (quayProps) => (dispatch) => {
  dispatch(createThunk(types.REQUESTED_MOVE_QUAY, quayProps));
};

UserActions.closeMoveQuayToNewStopDialog = () => (dispatch) => {
  dispatch(createThunk(types.CANCELLED_MOVE_QUAY_NEW_STOP, null));
};

UserActions.moveQuayToNewStopPlace = (quayProps) => (dispatch) => {
  dispatch(createThunk(types.REQUESTED_MOVE_QUAY_NEW_STOP, quayProps));
};

UserActions.lookupCoordinates = (latLng, triggeredByDrag) => (dispatch) => {
  dispatch(
    createThunk(types.LOOKUP_COORDINATES, {
      position: latLng,
      triggeredByDrag,
    }),
  );
};

UserActions.showRemoveStopPlaceFromParent = (stopPlaceId) => (dispatch) => {
  dispatch(createThunk(types.SHOW_REMOVE_STOP_PLACE_FROM_PARENT, stopPlaceId));
};

UserActions.hideRemoveStopPlaceFromParent = () => (dispatch) => {
  dispatch(createThunk(types.HIDE_REMOVE_STOP_PLACE_FROM_PARENT, null));
};

UserActions.createMultimodalWith = (stopPlaceId, fromMain) => (dispatch) => {
  dispatch(getAddStopPlaceInfo([stopPlaceId])).then((response) => {
    if (response.data) {
      const foundStop = Object.values(response.data)[0][0];
      const newStopPlace = new ParentStopPlace().createNew(
        foundStop.name,
        foundStop,
      );
      dispatch(
        createThunk(types.CREATE_NEW_MULTIMODAL_STOP_FROM_EXISTING, {
          newStopPlace,
          fromMain,
        }),
      );
      const { location } = newStopPlace;
      dispatch(
        getLocationPermissionsForCoordinates(location.lng, location.lat),
      );
      dispatch(UserActions.navigateTo(`/${Routes.STOP_PLACE}/`, "new"));
    }
  });
};

UserActions.toggleShowPublicCode = (value) => (dispatch) => {
  Settings.setShowPublicCode(value);
  dispatch(createThunk(types.TOGGLE_SHOW_PUBLIC_CODE, value));
};

const getQuayById = (quays = [], quayId) => {
  for (let i = 0; quays.length; i++) {
    if (quays[i].id === quayId) return quays[i];
  }
  return null;
};

const getQuaysForMergeInfo = (stopPlace) => {
  if (!stopPlace || !stopPlace.length) return [];

  return stopPlace[0].quays.map((quay) => ({
    publicCode: quay.publicCode,
    compassBearing: quay.compassBearing,
    privateCode: getIn(quay, ["privateCode", "value"], null),
    id: quay.id,
  }));
};

export default UserActions;

export const updateAuth = (auth) => (dispatch) => {
  dispatch(createThunk(types.UPDATED_AUTH, auth));
};

export const fetchUserPermissions = () => (dispatch, getState) => {
  dispatch(getUserPermissions());
};

export const fetchLocationPermissions = (position) => (dispatch) => {
  dispatch(getLocationPermissionsForCoordinates(position[1], position[0]));
};
