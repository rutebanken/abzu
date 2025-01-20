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

import {
  getAddStopPlaceInfo,
  getLocationPermissionsForCoordinates,
  getStopPlaceById,
} from "../actions/TiamatActions";
import Routes from "../routes/";
import { createThunk, UserActions } from "./";
import * as types from "./Types";

var StopPlacesGroupActions = {};

StopPlacesGroupActions.useStopPlaceIdForNewGroup =
  (stopPlaceId) => (dispatch) => {
    dispatch(createThunk(types.CREATED_NEW_GROUP_OF_STOP_PLACES, stopPlaceId));
    // i.e already creating a new group of stop place, update state instead
    if (
      window.location.pathname.indexOf(`/${Routes.GROUP_OF_STOP_PLACE}/new`) >
      -1
    ) {
      dispatch(StopPlacesGroupActions.createNewGroup(stopPlaceId));
    } else {
      dispatch(
        UserActions.navigateTo(`/${Routes.GROUP_OF_STOP_PLACE}/`, "new"),
      );
    }
  };

StopPlacesGroupActions.changeName = (name) => (dispatch) => {
  dispatch(createThunk(types.CHANGED_STOP_PLACE_GROUP_NAME, name));
};

StopPlacesGroupActions.changeDescription = (description) => (dispatch) => {
  dispatch(
    createThunk(types.CHANGED_STOP_PLACE_GROUP_DESCRIPTION, description),
  );
};

StopPlacesGroupActions.removeMemberFromGroup = (stopPlaceId) => (dispatch) => {
  dispatch(createThunk(types.REMOVED_GROUP_MEMBER, stopPlaceId));
};

StopPlacesGroupActions.addMemberToGroup = (stopPlaceId) => (dispatch) => {
  dispatch(createThunk(types.REQUESTED_MEMBER_INFO, null));
  dispatch(getStopPlaceById(stopPlaceId)).then((result) => {
    dispatch(createThunk(types.RECEIVED_MEMBER_INFO, result));
  });
};

StopPlacesGroupActions.addMembersToGroup = (stopPlaceIds) => (dispatch) => {
  dispatch(createThunk(types.REQUESTED_MEMBER_INFO, null));
  dispatch(getAddStopPlaceInfo(stopPlaceIds)).then((result) => {
    dispatch(createThunk(types.RECEIVED_MEMBERS_INFO, result));
  });
};

StopPlacesGroupActions.discardChanges = () => (dispatch) => {
  dispatch(createThunk(types.DISCARDED_GOS_CHANGES, null));
};

StopPlacesGroupActions.createNewGroup = (stopPlaceId) => (dispatch) => {
  dispatch(getStopPlaceById(stopPlaceId))
    .then((result) => {
      if (
        result &&
        result.data &&
        result.data.stopPlace &&
        result.data.stopPlace.length
      ) {
        const stopPlace = result.data.stopPlace[0];
        dispatch(createThunk(types.SETUP_NEW_GROUP, result));
        if (stopPlace.location) {
          dispatch(
            getLocationPermissionsForCoordinates(
              stopPlace.location[0],
              stopPlace.location[1],
            ),
          );
        }
      } else {
        dispatch(createThunk(types.ERROR_NEW_GROUP, null));
        dispatch(UserActions.navigateTo("/", ""));
      }
    })
    .catch((err) => {
      dispatch(createThunk(types.ERROR_NEW_GROUP, null));
      dispatch(UserActions.navigateTo("/", ""));
    });
};

export default StopPlacesGroupActions;
