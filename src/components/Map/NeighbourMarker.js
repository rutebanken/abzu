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

import { divIcon } from "leaflet";
import PropTypes from "prop-types";
import React from "react";
import ReactDOM from "react-dom/server";
import { Marker, Popup } from "react-leaflet";
import { connect } from "react-redux";
import { isLegalChildStopPlace } from "../../modelUtils/leafletUtils";
import CustomMarkerIcon from "./CustomMarkerIcon";
import PopupButton from "./PopupButton";
import { shallowCompareNeighbourMarker as shallowCompare } from "./shallowCompare/";

class NeighbourMarker extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isAllowedToCreateFrom: false,
    };
  }

  static propTypes = {
    position: PropTypes.arrayOf(Number),
    handleOnClick: PropTypes.func.isRequired,
    name: PropTypes.string.isRequired,
    stopType: PropTypes.string,
    index: PropTypes.number.isRequired,
    translations: PropTypes.object.isRequired,
    id: PropTypes.string,
    handleHideQuaysForNeighbourStop: PropTypes.func,
    isShowingQuays: PropTypes.bool.isRequired,
    isEditingStop: PropTypes.bool.isRequired,
    isEditingGroup: PropTypes.bool,
  };

  shouldComponentUpdate(nextProps, nextState) {
    if (this.state.isAllowedToCreateFrom !== nextState.isAllowedToCreateFrom) {
      return true;
    }
    return shallowCompare(this.props, nextProps);
  }

  getIsMergingStopAllowed() {
    const { currentStopIsMultiModal, isMultimodal, disabled, isEditingStop } =
      this.props;

    const { isAllowedToCreateFrom } = this.state;

    if (disabled || !isAllowedToCreateFrom) return false;

    if (isMultimodal || currentStopIsMultiModal) {
      return false;
    }
    return isEditingStop;
  }

  render() {
    const {
      position,
      handleOnClick,
      index,
      name,
      stopType,
      translations,
      id,
      handleShowQuays,
      handleHideQuays,
      isShowingQuays,
      handleMergeStopPlace,
      handleAddToGroup,
      hasExpired,
      isMultimodal,
      isChildOfParent,
      submode,
      stopPlace,
      isEditingGroup,
      handleCreateGroup,
    } = this.props;

    const { isAllowedToCreateFrom } = this.state;

    if (!position) return null;

    const isMergingStopAllowed = this.getIsMergingStopAllowed();

    let divIconBodyMarkup = ReactDOM.renderToStaticMarkup(
      <CustomMarkerIcon
        markerIndex={index}
        stopType={stopType}
        submode={submode}
        hasExpired={hasExpired}
        isMultimodal={isMultimodal}
        active={false}
      />,
    );

    let icon = divIcon({
      html: divIconBodyMarkup,
      iconAnchor: [10, 20],
      iconSize: [20, 20],
      popupAnchor: [5, 17],
    });

    let titleStyle = {
      fontWeight: 600,
      color: "#41c0c4",
      fontSize: "1.2em",
      borderBottom: "1px dotted",
      cursor: "pointer",
    };

    return (
      <Marker
        key={"neighbour-stop" + id}
        keyboard={false}
        icon={icon}
        position={position}
        draggable={false}
        eventHandlers={{
          popupopen: () => {
            this.setState({
              isAllowedToCreateFrom: isLegalChildStopPlace(stopPlace),
            });
          },
        }}
      >
        <Popup autoPan={false}>
          <div>
            <div
              style={{
                display: "inline-block",
                width: "100%",
                marginBottom: 15,
                textAlign: "center",
              }}
              onClick={handleOnClick}
            >
              <div style={{ display: "inline-block" }}>
                <div>
                  <span style={titleStyle}>{name || id}</span>
                  {hasExpired && (
                    <div
                      style={{
                        marginTop: 4,
                        fontWeight: 600,
                        padding: "0px 5px",
                        color: "#fff",
                        background: "rgb(187, 39, 28)",
                      }}
                    >
                      {translations.expired}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div
              style={{ display: "block", width: "auto", textAlign: "center" }}
            >
              <span style={{ display: "inline-block", textAlign: "center" }}>
                {position[0]}
              </span>
              <span style={{ display: "inline-block", marginLeft: 3 }}>
                {position[1]}
              </span>
            </div>
            <PopupButton
              hidden={
                !isEditingGroup || isChildOfParent || !isAllowedToCreateFrom
              }
              onClick={() => handleAddToGroup(id)}
              label={translations.addToGroup}
            />
            <PopupButton
              hidden={isChildOfParent || !isAllowedToCreateFrom}
              onClick={() => {
                handleCreateGroup(id);
              }}
              label={translations.createGOS}
            />
            <PopupButton
              hidden={!isMergingStopAllowed}
              onClick={() => handleMergeStopPlace(id, name)}
              label={translations.mergeStopPlace}
            />
            {isShowingQuays ? (
              <PopupButton
                hidden={isMultimodal}
                onClick={() => handleHideQuays(id)}
                label={translations.hideQuays}
              />
            ) : (
              <PopupButton
                hidden={isMultimodal}
                onClick={() => handleShowQuays(id)}
                label={translations.showQuays}
              />
            )}
            <PopupButton
              hidden={
                isMultimodal ||
                isChildOfParent ||
                !isAllowedToCreateFrom ||
                hasExpired
              }
              onClick={() => this.props.createNewMultimodalStopFrom(id)}
              label={translations.createMultimodal}
            />
          </div>
        </Popup>
      </Marker>
    );
  }
}

export default connect()(NeighbourMarker);
