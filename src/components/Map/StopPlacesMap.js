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

import debounce from "lodash.debounce";
import React from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { StopPlaceActions, UserActions } from "../../actions/";
import { getNeighbourStops } from "../../actions/TiamatActions";
import { getMarkersForMap } from "../../selectors/StopPlaceMap";
import Settings from "../../singletons/SettingsManager";
import { getIn } from "../../utils/";
import LeafletMap from "./LeafletMap";

class StopPlacesMap extends React.Component {
  constructor(props) {
    super(props);
    this.getNearbyStops = debounce(this.getNeighbourStops.bind(this), 500);
  }

  getNeighbourStops(ignoreStopId, bounds, includeExpired) {
    this.props.dispatch(
      getNeighbourStops(ignoreStopId, bounds, includeExpired),
    );
  }

  handleClick(e, map) {
    const { isCreatingNewStop } = this.props;

    if (isCreatingNewStop) {
      map.doubleClickZoom.disable();
      this.props.dispatch(StopPlaceActions.createNewStop(e.latlng));
    } else {
      map.doubleClickZoom.enable();
    }
  }

  handleZoomEnd(event) {
    const center = event.target.getCenter();
    this.props.dispatch(
      UserActions.setCenterAndZoom(
        [center.lat, center.lng],
        event.target.getZoom(),
      ),
    );
  }

  handleBaselayerChanged(value) {
    this.props.dispatch(UserActions.changeActiveBaselayer(value));
  }

  handleMapMoveEnd(event, map) {
    const zoom = map.getZoom();
    const center = map.getCenter();

    let includeExpired = new Settings().getShowExpiredStops();

    const { dispatch } = this.props;

    dispatch(UserActions.setCenterAndZoom([center.lat, center.lng], null));

    if (zoom > 14) {
      const bounds = map.getBounds();
      const { ignoreStopId } = this.props;
      this.getNearbyStops(ignoreStopId, bounds, includeExpired);
    } else {
      const { neighbourMarkersCount } = this.props;
      if (neighbourMarkersCount) {
        dispatch(UserActions.removeStopsNearbyForOverview());
      }
    }
  }

  render() {
    const { position, markers, zoom } = this.props;

    return (
      <LeafletMap
        position={position}
        markers={markers}
        zoom={zoom}
        handleZoomEnd={this.handleZoomEnd.bind(this)}
        onDoubleClick={this.handleClick.bind(this)}
        handleDragEnd={() => {}}
        handleMapMoveEnd={this.handleMapMoveEnd.bind(this)}
        dragableMarkers={false}
        activeBaselayer={this.props.activeBaselayer}
        handleBaselayerChanged={this.handleBaselayerChanged.bind(this)}
        enablePolylines={false}
      />
    );
  }
}

const mapStateToProps = (state) => ({
  position: state.stopPlace.centerPosition,
  neighbourMarkersCount: state.stopPlace.neighbourStops
    ? state.stopPlace.neighbourStops.length
    : 0,
  markers: getMarkersForMap(state),
  zoom: state.stopPlace.zoom,
  isCreatingNewStop: state.user.isCreatingNewStop,
  activeBaselayer: state.user.activeBaselayer,
  ignoreStopId: getIn(state.stopPlace, ["activeSearchResult", "id"], undefined),
});

export default injectIntl(connect(mapStateToProps)(StopPlacesMap));
