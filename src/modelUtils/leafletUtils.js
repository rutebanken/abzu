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

import { LatLng } from "leaflet";

export const getUniquePathLinks = (a, key) => {
  var seen = {};
  return a.filter(function (item) {
    let k = key(item);
    return seen.hasOwnProperty(k) ? false : (seen[k] = true);
  });
};

export const calculateDistance = (coords) => {
  let latlngDistances = coords.map(
    (position) => new LatLng(position[0], position[1]),
  );
  let totalDistance = 0;

  for (let i = 0; i < latlngDistances.length; i++) {
    if (latlngDistances[i + 1] == null) break;
    totalDistance += latlngDistances[i].distanceTo(latlngDistances[i + 1]);
  }
  return totalDistance;
};

export const calculateEstimate = (distance) => {
  const walkingSpeed = 1.34112; // i.e. 3 mph / 3.6
  return Math.max(Math.floor(distance / walkingSpeed), 1);
};

export const isChildTooFarAway = (distance = 301) => distance <= 300;
export const isMemberTooFarAway = (distance = 601) => distance <= 600;

/* filters stopPlaces that elligible to be added to parent stop place
  (not parent or child of a multimodal stop place) and sorts them by distance asc
 */
export const getChildStopPlaceSuggestions = (
  children,
  stopPlaceCentroid,
  neighbourStops,
  nFirst,
) => {
  const alreadyAdded = children.map((child) => child.id);

  let suggestions = neighbourStops.filter(
    (stop) =>
      !stop.isParent &&
      !stop.isChildOfParent &&
      alreadyAdded.indexOf(stop.id) === -1,
  );

  if (stopPlaceCentroid) {
    suggestions = (
      suggestions.map((stop) => {
        let distance = null;
        if (stop.location) {
          distance = calculateDistance([stopPlaceCentroid, stop.location]);
        }
        return {
          ...stop,
          distance,
        };
      }) || []
    ).sort((a, b) => a.distance - b.distance);
  }

  const legalSuggestions = (suggestions || []).filter(
    (suggestion) =>
      isLegalChildStopPlace(suggestion) &&
      isChildTooFarAway(suggestion.distance),
  );

  return legalSuggestions.slice(0, nFirst);
};

export const getGroupMemberSuggestions = (
  exisitingMembers,
  centroid,
  neighbourStops,
  nFirst,
) => {
  const alreadyAdded = exisitingMembers.map((member) => member.id);

  let suggestions = neighbourStops.filter(
    (stop) => !stop.isChildOfParent && alreadyAdded.indexOf(stop.id) === -1,
  );

  if (centroid) {
    suggestions = (
      suggestions.map((stop) => {
        let distance = null;
        if (stop.location) {
          distance = calculateDistance([centroid, stop.location]);
        }
        return {
          ...stop,
          distance,
        };
      }) || []
    ).sort((a, b) => a.distance - b.distance);
  }

  const legalSuggestions = (suggestions || []).filter(
    (suggestion) =>
      isMemberTooFarAway(suggestion.distance) &&
      isLegalChildStopPlace(suggestion),
  );

  return legalSuggestions.slice(0, nFirst);
};

export const isLegalChildStopPlace = (stopPlace) => {
  if (!stopPlace) {
    return false;
  }

  return stopPlace.permissions?.canEdit || false;
};
