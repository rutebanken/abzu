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

import PropTypes from "prop-types";
import React from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import {
  StopPlaceActions,
  StopPlacesGroupActions,
  UserActions,
} from "../../actions/";
import { getNeighbourStopPlaceQuays } from "../../actions/TiamatActions";
import { Entities } from "../../models/Entities";
import Routes from "../../routes/";
import { getIn, setDecimalPrecision } from "../../utils";
import { getStopPermissions } from "../../utils/permissionsUtils";
import BoardingPositionMarker from "./BoardingPositionMarker";
import CoordinateMarker from "./CoordinateMarker";
import CycleParkingMarker from "./CycleParkingMarker";
import * as MarkerStrings from "./markerText";
import NeighbourMarker from "./NeighbourMarker";
import NewStopMarker from "./NewStopMarker";
import ParkAndRideMarker from "./ParkAndRideMarker";
import QuayMarker from "./QuayMarker";
import StopPlaceMarker from "./StopPlaceMarker";

class MarkerList extends React.Component {
  static propTypes = {
    handleDragEnd: PropTypes.func.isRequired,
  };

  UNSAFE_componentWillMount() {
    this.createMarkerList(this.props);
  }

  UNSAFE_componentWillUpdate(nextProps) {
    this.createMarkerList(nextProps);
  }

  handleAdjustCentroid() {
    this.props.dispatch(StopPlaceActions.adjustCentroid());
  }

  handleAddToGroup(stopPlaceId) {
    this.props.dispatch(StopPlacesGroupActions.addMemberToGroup(stopPlaceId));
  }

  handleStopOnClick(id) {
    const { dispatch, path } = this.props;
    const isAlreadyActive = path.location.pathname.indexOf(id) > -1;

    if (!isAlreadyActive) {
      dispatch(StopPlaceActions.setStopPlaceLoading(true));
      dispatch(UserActions.navigateTo(`/${Routes.STOP_PLACE}/`, id));
    }
  }

  handleNewStopClick(position) {
    const { dispatch } = this.props;
    dispatch(StopPlaceActions.useNewStopAsCurrent());
    if (position) {
      dispatch(
        StopPlaceActions.changeLocationNewStop({
          lat: position[0],
          lng: position[1],
        }),
      );
    }
    dispatch(UserActions.navigateTo(`/${Routes.STOP_PLACE}/`, "new"));
  }

  handleRemoveFromGroup(stopPlaceId) {
    this.props.dispatch(
      StopPlacesGroupActions.removeMemberFromGroup(stopPlaceId),
    );
  }

  createNewMultimodalStopFrom(stopPlaceId) {
    const { dispatch, isEditingStop } = this.props;
    dispatch(UserActions.createMultimodalWith(stopPlaceId, !isEditingStop));
  }

  handleDragEndNewStop(event) {
    this.props.dispatch(
      StopPlaceActions.changeLocationNewStop(event.target.getLatLng()),
    );
  }

  connectToAdjacentStop(stopPlaceId) {
    this.props.dispatch(UserActions.showAddAdjacentStopDialog(stopPlaceId));
  }

  handleShowQuays(id) {
    this.props.dispatch(getNeighbourStopPlaceQuays(id));
  }

  handleMergeStopPlace(id, name) {
    this.props.dispatch(UserActions.showMergeStopDialog(id, name));
  }

  handleHideQuays(id) {
    this.props.dispatch(UserActions.hideQuaysForNeighbourStop(id));
  }

  handleUpdatePathLink(coords, id, type) {
    const { isCreatingPolylines, activeMap, pathLink } = this.props;

    if (activeMap) activeMap.closePopup();

    if (pathLink && pathLink.length) {
      let lastPathLink = pathLink[pathLink.length - 1];

      const lastPathLinkFromId = getIn(
        lastPathLink,
        ["from", "placeRef", "addressablePlace", "id"],
        null,
      );

      if (lastPathLinkFromId === id && !lastPathLink.to) {
        this.props.dispatch(UserActions.removeLastPolyline());
        return;
      }
    }

    if (isCreatingPolylines) {
      this.props.dispatch(
        UserActions.addFinalCoordinesToPolylines(coords, id, type),
      );
    } else {
      this.props.dispatch(UserActions.startCreatingPolyline(coords, id, type));
    }
  }

  handleElementDragEnd(index, type, event) {
    const { dispatch } = this.props;
    const position = event.target.getLatLng();

    dispatch(
      StopPlaceActions.changeElementPosition({ markerIndex: index, type }, [
        setDecimalPrecision(position.lat, 6),
        setDecimalPrecision(position.lng, 6),
      ]),
    );
  }

  handleBoardingPositionElementDragEnd(quayIndex, markerIndex, event) {
    const { dispatch } = this.props;
    const position = event.target.getLatLng();

    dispatch(
      StopPlaceActions.changeElementPosition(
        {
          markerIndex,
          quayIndex,
          type: "boarding-position",
        },
        [
          setDecimalPrecision(position.lat, 6),
          setDecimalPrecision(position.lng, 6),
        ],
      ),
    );
  }

  handleCreateGroup(stopPlaceId) {
    const { dispatch } = this.props;
    dispatch(StopPlacesGroupActions.useStopPlaceIdForNewGroup(stopPlaceId));
  }

  createMarkerList(props) {
    const {
      markers,
      handleDragEnd,
      changeCoordinates,
      dragableMarkers,
      neighbourStopQuays,
      missingCoordinatesMap,
      handleSetCompassBearing,
      disabled,
      intl,
      showExpiredStops,
      isEditingStop,
      currentIsNewStop,
      currentStopIsMultiModal,
      newStopIsMultiModal,
      isEditingGroup,
      focusedElement,
    } = props;
    const { formatMessage } = intl;

    let popupMarkers = [];

    const CustomPopupMarkerText = MarkerStrings.popupMarkerText(formatMessage);
    const newStopMarkerText =
      MarkerStrings.newStopPlaceMarkerText(formatMessage);

    markers.forEach((marker, stopIndex) => {
      // stopPlaceType specific names, such as platform, gate, etc.
      const localeStopType = getLocaleStopTypeName(marker.stopPlaceType, intl);

      if (marker.entityType === Entities.GROUP_OF_STOP_PLACE) {
        marker.members.forEach((member) => {
          popupMarkers.push(
            <StopPlaceMarker
              key={"gos-member-" + member.id}
              id={member.id}
              index={stopIndex}
              position={member.location}
              name={member.name}
              isShowingQuays={!!neighbourStopQuays[member.id]}
              handleShowQuays={this.handleShowQuays.bind(this)}
              handleHideQuays={this.handleHideQuays.bind(this)}
              submode={member.submode}
              formattedStopType={localeStopType}
              isMultimodal={member.isParent}
              isMultimodalChild={false}
              isGroupMember={true}
              disabled={disabled}
              canEdit={member.permissions.canEdit}
              handleDragEnd={() => {}}
              active={true}
              stopType={member.stopPlaceType}
              handleAdjustCentroid={() => {}}
              hasExpired={member.hasExpired}
              draggable={false}
              handleChangeCoordinates={() => {}}
              translations={CustomPopupMarkerText}
              handleOnClick={() => {
                this.handleStopOnClick(member.id);
              }}
              isEditingStop={isEditingStop}
              missingCoordinatesMap={missingCoordinatesMap}
              createNewMultimodalStopFrom={() => {}}
            />,
          );
        });
        return;
      }

      if (marker.coordinatePin) {
        popupMarkers.push(
          <CoordinateMarker position={marker.position} key={"coordinatePin"} />,
        );
      }

      if (marker.isNewStop && !isEditingStop) {
        popupMarkers.push(
          <NewStopMarker
            key={"newstop-parent- " + stopIndex}
            position={marker.location}
            newStopIsMultiModal={newStopIsMultiModal}
            handleDragEnd={this.handleDragEndNewStop.bind(this)}
            text={newStopMarkerText}
            handleOnClick={() => {
              this.handleNewStopClick(marker.location);
            }}
          />,
        );
      } else {
        if (marker.isActive) {
          if (marker.isParent && marker.children) {
            marker.children.forEach((child, i) => {
              popupMarkers.push(
                <StopPlaceMarker
                  key={"stopPlace-child-" + marker.id + "-" + i}
                  id={child.id}
                  index={stopIndex}
                  position={child.location}
                  name={child.name || marker.name}
                  isShowingQuays={!!neighbourStopQuays[child.id]}
                  handleShowQuays={this.handleShowQuays.bind(this)}
                  handleHideQuays={this.handleHideQuays.bind(this)}
                  submode={child.submode}
                  formattedStopType={localeStopType}
                  isMultimodal={false}
                  isMultimodalChild={true}
                  disabled={disabled}
                  canEdit={child.permissions.canEdit}
                  handleDragEnd={handleDragEnd}
                  active={false}
                  stopType={child.stopPlaceType}
                  handleAdjustCentroid={this.handleAdjustCentroid.bind(this)}
                  hasExpired={marker.hasExpired}
                  draggable={false}
                  handleChangeCoordinates={changeCoordinates}
                  translations={CustomPopupMarkerText}
                  handleOnClick={() => {
                    this.handleStopOnClick(child.id);
                  }}
                  isEditingStop={isEditingStop}
                  missingCoordinatesMap={missingCoordinatesMap}
                  createNewMultimodalStopFrom={this.createNewMultimodalStopFrom.bind(
                    this,
                  )}
                  connectToAdjacentStop={this.connectToAdjacentStop.bind(this)}
                />,
              );

              if (neighbourStopQuays[child.id]) {
                neighbourStopQuays[child.id].forEach((quayOfChild, index) => {
                  popupMarkers.push(
                    <QuayMarker
                      index={index}
                      id={quayOfChild.id}
                      position={quayOfChild.location}
                      key={"quay-neighbour-child" + quayOfChild.id}
                      handleQuayDragEnd={() => {}}
                      translations={Object.assign(
                        {},
                        newStopMarkerText,
                        CustomPopupMarkerText,
                      )}
                      compassBearing={quayOfChild.compassBearing}
                      publicCode={quayOfChild.publicCode || ""}
                      privateCode={quayOfChild.privateCode || ""}
                      stopPlaceName={marker.name}
                      stopPlaceId={child.id}
                      formattedStopType={localeStopType}
                      handleUpdatePathLink={this.handleUpdatePathLink.bind(
                        this,
                      )}
                      handleChangeCoordinates={() => {}}
                      draggable={false}
                      belongsToNeighbourStop={true}
                      handleSetCompassBearing={() => {}}
                      showPathLink={!disabled}
                      isEditingStop={isEditingStop}
                      disabled={disabled}
                      currentIsNewStop={currentIsNewStop}
                    />,
                  );
                });
              }
            });
          }

          popupMarkers.push(
            <StopPlaceMarker
              key={"stopPlace-" + marker.id}
              id={marker.id}
              index={stopIndex}
              position={marker.location}
              name={marker.name}
              submode={marker.submode}
              formattedStopType={localeStopType}
              isMultimodal={marker.isParent}
              disabled={disabled}
              canEdit={marker.permissions.canEdit}
              handleDragEnd={handleDragEnd}
              active={!!marker.isActive}
              stopType={marker.stopPlaceType}
              handleAdjustCentroid={this.handleAdjustCentroid.bind(this)}
              draggable={dragableMarkers}
              handleChangeCoordinates={changeCoordinates}
              createNewMultimodalStopFrom={this.createNewMultimodalStopFrom.bind(
                this,
              )}
              translations={CustomPopupMarkerText}
              handleOnClick={() => {
                this.handleStopOnClick(marker.id);
              }}
              isEditingStop={isEditingStop}
              removeFromGroup={this.handleRemoveFromGroup.bind(this)}
              isEditingGroup={isEditingGroup}
              missingCoordinatesMap={missingCoordinatesMap}
              isMultimodalChild={marker.isChildOfParent}
              hasExpired={marker.hasExpired}
              isGroupMember={marker.isMemberOfGroup}
              handleCreateGroup={this.handleCreateGroup.bind(this)}
              allowConnectToAdjacentStop={false}
            />,
          );

          if (marker.parking) {
            marker.parking.forEach((parking, index) => {
              let isParkAndRide =
                parking.parkingVehicleTypes &&
                parking.parkingVehicleTypes.indexOf("car") > -1;
              let isCycleParking =
                parking.parkingVehicleTypes &&
                parking.parkingVehicleTypes.indexOf("pedalCycle") > -1;

              if (isParkAndRide) {
                popupMarkers.push(
                  <ParkAndRideMarker
                    position={parking.location}
                    index={index}
                    name={parking.name || ""}
                    hasExpired={parking.hasExpired}
                    draggable={!disabled}
                    type="parking"
                    key={"parking-" + index}
                    totalCapacity={parking.totalCapacity}
                    translations={{
                      title: formatMessage({
                        id: "parking_item_title_parkAndRide",
                      }),
                      totalCapacity: formatMessage({ id: "total_capacity" }),
                      parkingExpired: formatMessage({ id: "parking_expired" }),
                      totalCapacityUnknown: formatMessage({
                        id: "total_capacity_unknown",
                      }),
                    }}
                    handleDragEnd={this.handleElementDragEnd.bind(this)}
                  />,
                );
              } else if (isCycleParking) {
                popupMarkers.push(
                  <CycleParkingMarker
                    position={parking.location}
                    index={index}
                    name={parking.name || ""}
                    totalCapacity={parking.totalCapacity}
                    hasExpired={parking.hasExpired}
                    key={"parking-" + index}
                    draggable={!disabled}
                    type="parking"
                    translations={{
                      title: formatMessage({
                        id: "parking_item_title_bikeParking",
                      }),
                      totalCapacity: formatMessage({ id: "total_capacity" }),
                      parkingExpired: formatMessage({ id: "parking_expired" }),
                      totalCapacityUnknown: formatMessage({
                        id: "total_capacity_unknown",
                      }),
                    }}
                    handleDragEnd={this.handleElementDragEnd.bind(this)}
                  />,
                );
              }
            });
          }

          if (marker.quays) {
            marker.quays.forEach((quay, index) => {
              popupMarkers.push(
                <QuayMarker
                  index={index}
                  id={quay.id}
                  position={quay.location}
                  key={"quay-" + (quay.id || index)}
                  handleQuayDragEnd={this.handleElementDragEnd.bind(this)}
                  translations={Object.assign(
                    {},
                    newStopMarkerText,
                    CustomPopupMarkerText,
                  )}
                  compassBearing={quay.compassBearing}
                  publicCode={quay.publicCode || ""}
                  privateCode={quay.privateCode || ""}
                  stopPlaceName={marker.name}
                  stopPlaceId={marker.id}
                  disabled={disabled}
                  formattedStopType={localeStopType}
                  handleUpdatePathLink={this.handleUpdatePathLink.bind(this)}
                  handleChangeCoordinates={changeCoordinates}
                  draggable={!disabled}
                  belongsToNeighbourStop={!marker.isActive}
                  handleSetCompassBearing={handleSetCompassBearing}
                  showPathLink={!disabled}
                  isEditingStop={isEditingStop}
                  currentIsNewStop={currentIsNewStop}
                />,
              );

              if (
                focusedElement.type === "quay" &&
                index === focusedElement.index &&
                quay.boardingPositions
              ) {
                quay.boardingPositions.forEach((boardingPosition, bpIndex) => {
                  popupMarkers.push(
                    <BoardingPositionMarker
                      key={
                        "boarding-position-" + (boardingPosition.id || bpIndex)
                      }
                      position={boardingPosition?.location}
                      publicCode={boardingPosition?.publicCode || "N/A"}
                      translations={CustomPopupMarkerText}
                      handleChangeCoordinates={() =>
                        changeCoordinates(
                          {
                            type: "boarding-position",
                            quayIndex: index,
                            markerIndex: bpIndex,
                          },
                          boardingPosition.location,
                        )
                      }
                      handleDragEnd={(event) =>
                        this.handleBoardingPositionElementDragEnd(
                          index,
                          bpIndex,
                          event,
                        )
                      }
                      handleSetFocus={() => {
                        this.props.dispatch(
                          StopPlaceActions.setBoardingPositionElementFocus(
                            bpIndex,
                            index,
                          ),
                        );
                        const expandedQuayEl = document.querySelector(
                          ".boarding-position-item-expanded",
                        );
                        const scrollBodyEl =
                          document.querySelector("#scroll-body");
                        if (expandedQuayEl && scrollBodyEl) {
                          expandedQuayEl.scrollIntoView(true);
                          scrollBodyEl.scrollTop -= 50;
                        }
                      }}
                    />,
                  );
                });
              }
            });
          }
        } else {
          if ((showExpiredStops && marker.hasExpired) || !marker.hasExpired) {
            popupMarkers.push(
              <NeighbourMarker
                key={"neighbourStop-" + marker.id}
                id={marker.id}
                position={marker.location}
                name={marker.name}
                handleOnClick={() => {
                  this.handleStopOnClick(marker.id);
                }}
                index={stopIndex}
                isChildOfParent={marker.isChildOfParent}
                handleAddToGroup={() => {
                  this.handleAddToGroup(marker.id);
                }}
                submode={marker.submode}
                translations={CustomPopupMarkerText}
                isEditingStop={isEditingStop}
                isMultimodal={marker.isParent}
                currentStopIsMultiModal={currentStopIsMultiModal}
                disabled={disabled}
                stopType={marker.stopPlaceType}
                handleMergeStopPlace={this.handleMergeStopPlace.bind(this)}
                isShowingQuays={!!neighbourStopQuays[marker.id]}
                handleShowQuays={this.handleShowQuays.bind(this)}
                handleHideQuays={this.handleHideQuays.bind(this)}
                hasExpired={marker.hasExpired}
                createNewMultimodalStopFrom={this.createNewMultimodalStopFrom.bind(
                  this,
                )}
                stopPlace={marker}
                isEditingGroup={isEditingGroup}
                handleCreateGroup={this.handleCreateGroup.bind(this)}
              />,
            );

            if (neighbourStopQuays && neighbourStopQuays[marker.id]) {
              neighbourStopQuays[marker.id].forEach((quay, index) => {
                popupMarkers.push(
                  <QuayMarker
                    index={index}
                    parentId={stopIndex}
                    id={quay.id}
                    position={quay.location}
                    key={"quay-neighbour" + quay.id}
                    handleQuayDragEnd={() => {}}
                    translations={Object.assign(
                      {},
                      newStopMarkerText,
                      CustomPopupMarkerText,
                    )}
                    compassBearing={quay.compassBearing}
                    publicCode={quay.publicCode || ""}
                    privateCode={quay.privateCode || ""}
                    stopPlaceName={marker.name}
                    stopPlaceId={marker.id}
                    formattedStopType={localeStopType}
                    handleUpdatePathLink={this.handleUpdatePathLink.bind(this)}
                    handleChangeCoordinates={() => {}}
                    draggable={false}
                    belongsToNeighbourStop={true}
                    handleSetCompassBearing={() => {}}
                    showPathLink={!disabled}
                    isEditingStop={isEditingStop}
                    disabled={disabled}
                    currentIsNewStop={currentIsNewStop}
                  />,
                );
              });
            }
          }
        }
      }
    });
    this._popupMarkers = popupMarkers;
  }

  render() {
    return this._popupMarkers;
  }
}

const mapStateToProps = (state) => ({
  path: state.user.path,
  isCreatingPolylines: state.stopPlace.isCreatingPolylines,
  currentIsNewStop: getIn(state.stopPlace, ["current", "isNewStop"], false),
  neighbourStopQuays: state.stopPlace.neighbourStopQuays || {},
  isEditingStop: state.router.location.pathname.indexOf(Routes.STOP_PLACE) > -1,
  isEditingGroup:
    state.router.location.pathname.indexOf(Routes.GROUP_OF_STOP_PLACE) > -1,
  missingCoordinatesMap: state.user.missingCoordsMap,
  activeMap: state.mapUtils.activeMap,
  pathLink: state.stopPlace.pathLink,
  showExpiredStops: state.stopPlace.showExpiredStops,
  disabled: !getStopPermissions(state.stopPlace.current).canEdit,
  stopPlace: state.stopPlace.current,
  newStopIsMultiModal: state.user.newStopIsMultiModal,
  currentStopIsMultiModal: getIn(
    state.stopPlace,
    ["current", "isParent"],
    false,
  ),
  focusedElement: state.mapUtils.focusedElement,
});

const getLocaleStopTypeName = (stopPlaceType, intl) => {
  if (stopPlaceType) {
    const { formatMessage } = intl;
    const formattedStopTypeId = formatMessage({
      id: `stopTypes_${stopPlaceType}_quayItemName`,
    });
    return formatMessage({ id: formattedStopTypeId || "name" });
  }
  return "";
};

export default injectIntl(connect(mapStateToProps)(MarkerList));
