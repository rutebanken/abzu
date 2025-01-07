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

import L from "leaflet";
import PropTypes from "prop-types";
import React from "react";
import { Marker, Popup } from "react-leaflet";
import { connect } from "react-redux";
import { fetchLocationPermissions } from "../../actions/UserActions";

import markerShadow from "../../static/icons/marker-shadow.png";
import newStopIcon from "../../static/icons/new-stop-icon-2x.png";
import { getAllowanceInfoFromLocationPermissions } from "../../utils/permissionsUtils";

class NewStopMarker extends React.Component {
  static propTypes = {
    text: PropTypes.object.isRequired,
    handleOnClick: PropTypes.func.isRequired,
    handleDragEnd: PropTypes.func.isRequired,
  };

  componentDidMount() {
    const { position, fetchLocationPermissions } = this.props;
    fetchLocationPermissions(position);
  }

  render() {
    let {
      children,
      position,
      handleOnClick,
      handleDragEnd,
      text,
      newStopIsMultiModal,
      allowanceInfo,
      fetchLocationPermissions,
    } = this.props;

    var icon = L.icon({
      iconUrl: newStopIcon,
      shadowUrl: markerShadow,
      iconSize: [30, 45],
      iconAnchor: [17, 42],
      popupAnchor: [0, 0],
      shadowAnchor: [12, 12],
      shadowSize: [36, 16],
    });

    console.log({ allowanceInfo });

    const canEdit = allowanceInfo?.canEdit || false;

    return (
      <Marker
        ref="newstopMarker"
        key="newstop-key"
        eventHandlers={{
          dragend: (e) => {
            const newPosition = e.target.getLatLng();
            fetchLocationPermissions([newPosition.lat, newPosition.lng]);
            handleDragEnd(e);
          },
        }}
        draggable={true}
        position={position}
        icon={icon}
      >
        <Popup>
          <div>
            <span>{children}</span>
            {canEdit ? (
              <div>
                <p style={{ fontWeight: "600" }}>
                  {newStopIsMultiModal
                    ? text.newParentStopTitle
                    : text.newStopTitle}
                </p>
                <p>
                  {" "}
                  {newStopIsMultiModal
                    ? text.newParentStopQuestion
                    : text.newStopQuestion}
                </p>
                <div style={{ textAlign: "center" }}>
                  <div
                    className="marker-popup-button"
                    style={{ maxWidth: 180 }}
                    onClick={() => {
                      handleOnClick(position);
                    }}
                  >
                    {text.createNow}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontWeight: 600, textAlign: "center" }}>
                  {newStopIsMultiModal
                    ? text.newParentStopTitle
                    : text.newStopTitle}
                </p>
                <div style={{ textAlign: "center" }}>
                  <div className="marker-popup-not-legal">
                    {text.createNotAllowed}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Popup>
      </Marker>
    );
  }
}

export default connect(
  ({ user }) => ({
    allowanceInfo: getAllowanceInfoFromLocationPermissions(
      user.locationPermissions,
    ),
  }),
  { fetchLocationPermissions },
)(NewStopMarker);
