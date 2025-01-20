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

import moment from "moment";
import * as types from "../actions/Types";
import {
  calculateDistance,
  calculateEstimate,
  getUniquePathLinks,
} from "../modelUtils/leafletUtils";
import { hasExpired } from "../modelUtils/validBetween";
import ChildOfParentStopPlace from "../models/ChildOfParentStopPlace";
import { Entities } from "../models/Entities";
import GroupOfStopPlaces from "../models/GroupOfStopPlaces";
import ParentStopPlace from "../models/ParentStopPlace";
import Parking from "../models/Parking";
import PathLink from "../models/PathLink";
import Quay from "../models/Quay";
import StopPlace from "../models/StopPlace";
import PARKING_TYPE from "../models/parkingType";
import PARKING_VEHICLE_TYPE from "../models/parkingVehicleType";
import { getImportedId } from "../models/stopPlaceUtils";
import { getIn, getInTransform, setDecimalPrecision } from "../utils/";

const helpers = {};

helpers.mapParkingToClient = (parkingObjs = []) =>
  parkingObjs.map((parking) => new Parking(parking).toClient());

helpers.sortQuays = (current, attribute) => {
  let copy = JSON.parse(JSON.stringify(current));
  let quays = copy.quays;
  quays.sort((a, b) =>
    (a[attribute] || "ZZZZZ").localeCompare(b[attribute] || "ZZZZZ", "nb", {
      numeric: true,
      sensitivity: "base",
    }),
  );
  return {
    ...copy,
    quays,
  };
};

helpers.updateParentStopWithStopPlaces = (current, payload) => {
  const newStopPlace = Object.assign({}, current);
  const newChildren = payload.map((child) => {
    const newChild = { ...child };
    newChild.name =
      newChild.name && newChild.name.value ? newChild.name.value : current.name;
    newChild.quays = newChild.quays.map((quay) => ({
      ...quay,
      privateCode: quay.privateCode?.value,
    }));
    return newChild;
  });
  newStopPlace.children = newStopPlace.children.concat(newChildren);
  return newStopPlace;
};

helpers.updateStopWithTags = (current, payload) => {
  const copy = JSON.parse(JSON.stringify(current));
  const { result } = payload;

  if (
    result.data &&
    result.data.stopPlace &&
    result.data &&
    result.data.stopPlace.length
  ) {
    const tags = result.data.stopPlace[0].tags;
    copy.tags = tags;
    return copy;
  }
  return current;
};

helpers.updateParenStopWithoutStopPlace = (current, payload) => {
  const copy = JSON.parse(JSON.stringify(current));
  copy.children = copy.children.filter((child) => child.id !== payload);
  return copy;
};

helpers.mapPathLinkToClient = (pathLinks = []) => {
  // NRP-1675, this is a temporary solution until pathLinks(stopPLaceId: $id) returns a unique list
  let uniquePathLinks = getUniquePathLinks(
    pathLinks,
    (pathLink) => pathLink.id,
  );
  return uniquePathLinks.map((data) => new PathLink(data).toClient());
};

helpers.updateEstimateForPathLink = (action, pathLink) => {
  const { index, estimate } = action.payload;
  let updatedPathLink = JSON.parse(JSON.stringify(pathLink));
  updatedPathLink[index].estimate = estimate;
  return updatedPathLink;
};

helpers.addNewPointToPathlink = (action, pathLink) => {
  const coordinates = action.payload;
  let updatedPathLink = JSON.parse(JSON.stringify(pathLink));

  let lastPathLink = updatedPathLink[updatedPathLink.length - 1];

  if (!lastPathLink.inBetween) {
    lastPathLink.inBetween = [];
  }

  lastPathLink.inBetween.push(coordinates);

  return updatedPathLink;
};

helpers.updatePathLinkWithNewEntry = (action, pathLink) => {
  if (action.type === types.STARTED_CREATING_POLYLINE) {
    let newPathLink = {
      from: {
        placeRef: {
          ref: action.payload.id,
          addressablePlace: {
            id: action.payload.id,
            geometry: {
              type: "Point",
              legacyCoordinates: [action.payload.coordinates],
            },
          },
        },
      },
    };
    return pathLink.concat(newPathLink);
  }

  if (action.type === types.ADDED_FINAL_COORDINATES_TO_POLYLINE) {
    let lastPathLink = JSON.parse(
      JSON.stringify(pathLink[pathLink.length - 1]),
    );

    let latlngCoordinates = [];

    let startCoordinates = getIn(
      lastPathLink,
      ["from", "placeRef", "addressablePlace", "geometry", "legacyCoordinates"],
      null,
    );

    if (startCoordinates) {
      latlngCoordinates.push(startCoordinates[0]);
    }

    if (lastPathLink.inBetween) {
      latlngCoordinates.push.apply(latlngCoordinates, lastPathLink.inBetween);
    }

    lastPathLink.to = {
      placeRef: {
        ref: action.payload.id,
        addressablePlace: {
          id: action.payload.id,
          geometry: {
            type: "Point",
            legacyCoordinates: [action.payload.coordinates],
          },
        },
      },
    };

    latlngCoordinates.push(action.payload.coordinates);

    lastPathLink.distance = calculateDistance(latlngCoordinates);
    lastPathLink.estimate = calculateEstimate(lastPathLink.distance);

    return pathLink.slice(0, pathLink.length - 1).concat(lastPathLink);
  }
};

helpers.mapVersionToClientVersion = (source) => {
  if (source) {
    const transformer = (value) => moment(value).format("DD-MM-YYYY HH:mm");

    return source
      .slice()
      .sort((a, b) => Number(b.version) - Number(a.version))
      .map((data) => {
        let version = {
          id: data.id,
          version: data.version,
          name: getIn(data, ["name", "value"], ""),
          fromDate: getInTransform(
            data.validBetween,
            ["fromDate"],
            "",
            transformer,
          ),
          toDate: getInTransform(
            data.validBetween,
            ["toDate"],
            "",
            transformer,
          ),
          versionComment: data.versionComment,
          changedBy: data.changedBy ? data.changedBy : "",
        };
        return version;
      });
  }
  return [];
};

helpers.mapStopToClientStop = (
  stop,
  isActive,
  parking,
  userDefinedCoordinates = {},
  resourceId,
) => {
  if (stop.__typename === "ParentStopPlace") {
    if (resourceId && stop.id !== resourceId) {
      return new ChildOfParentStopPlace(
        stop,
        isActive,
        parking,
        userDefinedCoordinates,
        resourceId,
      ).toClient();
    } else {
      return new ParentStopPlace(
        stop,
        isActive,
        parking,
        userDefinedCoordinates,
      ).toClient();
    }
  } else {
    return new StopPlace(
      stop,
      isActive,
      parking,
      userDefinedCoordinates,
    ).toClient();
  }
};

helpers.mapQuayToClientQuay = (quay, accessibilityAssessment) => {
  return new Quay(quay, accessibilityAssessment).toClient();
};

helpers.mapNeighbourStopsToClientStops = (stops, currentStopPlace) => {
  const allStops = stops.map((stop) =>
    helpers.mapStopToClientStop(stop, false),
  );
  let extractedChildren = [];
  const currentStopPlaceId = currentStopPlace ? currentStopPlace.id : null;

  // extract all children of potential parent stop places
  allStops.forEach((stop) => {
    if (stop.isParent && stop.children) {
      const children = stop.children
        // a parent stop place may contain active stop as a child, i.e. sibling
        .filter((child) => child.id !== currentStopPlaceId)
        .map((child) => {
          child.name = child.name || stop.name;
          child.isChildOfParent = true;
          return child;
        });
      extractedChildren = extractedChildren.concat(children);
    }
  });
  return allStops.concat(extractedChildren);
};

helpers.mapSearchResultToStopPlaces = (stopPlaces) => {
  return stopPlaces.map((stop) => {
    if (stop.__typename === "StopPlace") {
      return helpers.mapSearchResultStopPlace(stop);
    } else if (stop.__typename === "ParentStopPlace") {
      return helpers.mapSearchResultParentStopPlace(stop);
    }
    return undefined;
  });
};

helpers.mapSearchResultStopPlace = (stop) => {
  let searchResult = new StopPlace(stop, true).toClient();
  searchResult.quays = stop.quays;
  return searchResult;
};

helpers.mapSearchResultatGroup = (groupsOfStopPlaces) => {
  return groupsOfStopPlaces.map((group) =>
    new GroupOfStopPlaces(group).toClient(),
  );
};

helpers.mapSearchResultParentStopPlace = (stop) => {
  try {
    // TODO: Refactor this to work with model class ParentStopPlace
    let parentTopographicPlace = getIn(
      stop,
      ["topographicPlace", "parentTopographicPlace", "name", "value"],
      "",
    );
    let topographicPlace = getIn(
      stop,
      ["topographicPlace", "name", "value"],
      "",
    );

    let clientParentStop = {
      isParent: true,
      id: stop.id,
      name: stop.name.value,
      isMissingLocation: !stop.geometry,
      stopPlaceType: stop.stopPlaceType,
      submode: stop.submode,
      transportMode: stop.transportMode,
      topographicPlace: topographicPlace,
      parentTopographicPlace: parentTopographicPlace,
      isActive: false,
      children: stop.children
        .map((childStop) => updateObjectWithLocation(childStop))
        .map((childStop) => {
          let newChildStop = Object.assign({}, childStop);
          newChildStop.name =
            newChildStop.name && newChildStop.name.value
              ? childStop.name.value
              : stop.name.value;
          return newChildStop;
        })
        .sort((a, b) => b.id.localeCompare(a.id)),
      importedId: getImportedId(stop.keyValues),
      accessibilityAssessment: stop.accessibilityAssessment,
      hasExpired: hasExpired(stop.validBetween),
      tags: stop.tags,
      geometry: stop.geometry,
      entityType: Entities.STOP_PLACE,
      permissions: stop.permissions,
    };

    if (stop.groups && stop.groups.length) {
      clientParentStop.groups = stop.groups.map((group) => {
        let newGroup = { ...group };
        newGroup.name = group.name && group.name.value ? group.name.value : "";
        return newGroup;
      });
      clientParentStop.belongsToGroup = true;
    } else {
      clientParentStop.groups = [];
      clientParentStop.belongsToGroup = false;
    }

    clientParentStop = updateObjectWithLocation(clientParentStop);

    return clientParentStop;
  } catch (ex) {
    console.error("Ex", ex);
  }
};

const updateObjectWithLocation = (stop) => {
  let newStop = Object.assign({}, stop);
  if (stop.geometry && stop.geometry.legacyCoordinates) {
    let coordinates = stop.geometry.legacyCoordinates[0].slice();
    newStop.location = [
      setDecimalPrecision(coordinates[1], 6),
      setDecimalPrecision(coordinates[0], 6),
    ];
    return newStop;
  }
  return stop;
};

helpers.mapReportSearchResultsToClientStop = (data) => {
  let result = [];
  let stops = data.slice();
  stops.forEach((stop) => {
    let stopPlace = helpers.mapStopToClientStop(stop, true, null, null, null);

    if (!stopPlace.quays) {
      stopPlace.quays = [];
    }

    if (!stopPlace.parking) {
      stopPlace.parking = [];
    }

    if (stopPlace.isParent && stopPlace.children) {
      stopPlace.modesFromChildren = stopPlace.children.map((child) => ({
        submode: child.submode,
        stopPlaceType: child.stopPlaceType,
      }));
      result = result.concat(stopPlace, stopPlace.children);
    } else {
      result = result.concat(stopPlace);
    }
    return stopPlace;
  });
  return result;
};

helpers.createNewStopFromLocation = (location) => ({
  id: null,
  name: "",
  description: "",
  location: location.map((pos) => setDecimalPrecision(pos, 6)),
  stopPlaceType: null,
  topographicPlace: "",
  tariffZones: [],
  quays: [],
  parking: [],
  isNewStop: true,
  isActive: true,
  keyValues: [],
});

helpers.createNewParentStopFromLocation = (location) => ({
  id: null,
  name: "",
  description: "",
  location: location.map((pos) => setDecimalPrecision(pos, 6)),
  isParent: true,
  children: [],
  isNewStop: true,
  isActive: true,
  keyValues: [],
});

helpers.getCenterPosition = (geometry) => {
  if (!geometry) return null;
  return [
    setDecimalPrecision(geometry.legacyCoordinates[0][1], 6),
    setDecimalPrecision(geometry.legacyCoordinates[0][0], 6),
  ];
};

helpers.updateKeyValuesByKey = (original, key, newValues, origin) => {
  const { index, type } = origin;

  if (type === "stopPlace") {
    return Object.assign({
      ...original,
      importedId: key === "imported-id" ? newValues : original.importedId,
      keyValues: original.keyValues.map((kv) => {
        if (kv.key === key) {
          return Object.assign({}, kv, { values: newValues });
        }
        return kv;
      }),
    });
  }

  if (type === "quay") {
    return Object.assign({
      ...original,
      quays: original.quays.map((quay, quayIndex) => {
        if (quayIndex === index) {
          if (key === "imported-id") {
            quay.importedId = newValues;
          }
          quay.keyValues = quay.keyValues.map((kv) => {
            if (kv.key === key) {
              return Object.assign({}, kv, { values: newValues });
            }
            return kv;
          });
        }
        return quay;
      }),
    });
  }
};

helpers.deleteKeyValuesByKey = (original, key, origin) => {
  const { index, type } = origin;

  if (type === "stopPlace") {
    return Object.assign({
      ...original,
      importedId: key === "imported-id" ? [] : original.importedId,
      keyValues: original.keyValues.filter((kv) => kv.key !== key),
    });
  }

  if (type === "quay") {
    return Object.assign({
      ...original,
      quays: original.quays.map((quay, quayIndex) => {
        if (quayIndex === index) {
          if (key === "imported-id") {
            quay.importedId = [];
          }
          quay.keyValues = quay.keyValues.filter((kv) => kv.key !== key);
        }
        return quay;
      }),
    });
  }
};

helpers.createKeyValuesPair = (original, key, newValues, origin) => {
  const { index, type } = origin;

  if (type === "stopPlace") {
    return Object.assign({
      ...original,
      keyValues: (original.keyValues || []).concat({
        key,
        values: newValues,
      }),
    });
  }

  if (type === "quay") {
    return Object.assign({
      ...original,
      quays: original.quays.map((quay, quayIndex) => {
        if (quayIndex === index) {
          quay.keyValues = (quay.keyValues || []).concat({
            key,
            values: newValues,
          });
        }
        return quay;
      }),
    });
  }
};

helpers.updateCurrentStopWithType = (current, type) => {
  return Object.assign({}, current, {
    stopPlaceType: type,
    submode: null,
  });
};

helpers.updateCurrentStopWithSubMode = (
  current,
  stopPlaceType,
  transportMode,
  submode,
) => {
  return Object.assign({}, current, {
    stopPlaceType,
    transportMode,
    submode,
  });
};

helpers.updateCurrentStopWithPosition = (current, location) => {
  return Object.assign({}, current, {
    location: location,
  });
};

helpers.updateCurrentWithNewElement = (current, payload) => {
  const { type, position, focusedElement } = payload;
  const copy = JSON.parse(JSON.stringify(current));

  const newElement = {
    location: position.slice(),
    name: "",
  };

  switch (type) {
    case "quay":
      copy.quays = copy.quays.concat({
        ...newElement,
        keyValues: [],
        boardingPositions: [],
      });
      break;
    case "boardingPosition":
      copy.quays[focusedElement.index].boardingPositions = copy.quays[
        focusedElement.index
      ].boardingPositions.concat({
        publicCode: "",
        location: position.slice(),
      });
      break;
    case PARKING_TYPE.PARK_AND_RIDE:
      copy.parking = copy.parking.concat({
        ...newElement,
        totalCapacity: null,
        parkingType: type,
        parkingVehicleTypes: [PARKING_VEHICLE_TYPE.CAR],
        hasExpired: false,
        validBetween: null,
      });
      break;
    case PARKING_TYPE.BIKE_PARKING:
      copy.parking = copy.parking.concat({
        ...newElement,
        totalCapacity: null,
        parkingType: type,
        parkingVehicleTypes: [PARKING_VEHICLE_TYPE.PEDAL_CYCLE],
        hasExpired: false,
        validBetween: null,
      });
      break;

    default:
      throw new Error("element not supported", type);
  }
  return copy;
};

helpers.updateCurrentWithoutElement = (current, payload) => {
  const { type, index } = payload;
  const copy = JSON.parse(JSON.stringify(current));

  switch (type) {
    case "quay":
      copy.quays = removeElementByIndex(copy.quays, index);
      break;
    case "boarding-position":
      copy.quays[payload.quayIndex].boardingPositions = removeElementByIndex(
        copy.quays[payload.quayIndex].boardingPositions,
        index,
      );
      break;
    case "parking":
      copy.parking = removeElementByIndex(copy.parking, index);
      break;
    default:
      throw new Error("element not supported", type);
  }
  return copy;
};

helpers.updateCurrentWithElementPositionChange = (current, payload) => {
  const { markerIndex, type, position } = payload;
  const copy = JSON.parse(JSON.stringify(current));

  switch (type) {
    case "quay":
      copy.quays[markerIndex] = Object.assign({}, copy.quays[markerIndex], {
        location: position,
      });
      break;
    case "boarding-position":
      copy.quays[payload.quayIndex].boardingPositions[markerIndex] =
        Object.assign(
          {},
          copy.quays[payload.quayIndex].boardingPositions[markerIndex],
          {
            location: position,
          },
        );
      break;
    case "parking":
      copy.parking[markerIndex] = Object.assign({}, copy.parking[markerIndex], {
        location: position,
      });
      break;
    default:
      console.log("element not supported", type);
  }

  return copy;
};

helpers.updateCurrentWithPublicCode = (current, payload) => {
  const { index, type, name } = payload;
  const copy = JSON.parse(JSON.stringify(current));

  switch (type) {
    case "quay":
      copy.quays[index] = Object.assign({}, copy.quays[index], {
        publicCode: name,
      });
      break;
    case "boarding-position":
      copy.quays[payload.quayIndex].boardingPositions[index] = Object.assign(
        {},
        copy.quays[payload.quayIndex].boardingPositions[index],
        {
          publicCode: name,
        },
      );
      break;
    default:
      throw new Error("element not supported", type);
  }
  return copy;
};

helpers.updateCurrentWithPrivateCode = (current, payload) => {
  const { index, type, name } = payload;
  const copy = JSON.parse(JSON.stringify(current));

  switch (type) {
    case "quay":
      copy.quays[index] = Object.assign({}, copy.quays[index], {
        privateCode: name,
      });
      break;
    default:
      throw new Error("element not supported", type);
  }
  return copy;
};

helpers.updateCompassBearing = (current, payload) => {
  const { compassBearing, index } = payload;
  const quaysCopy = current.quays.slice();
  quaysCopy[index].compassBearing = compassBearing;
  return {
    ...current,
    quays: quaysCopy,
  };
};

helpers.updateCurrentWithElementDescriptionChange = (current, payload) => {
  const { index, type, description } = payload;
  const copy = JSON.parse(JSON.stringify(current));

  switch (type) {
    case "quay":
      copy.quays[index] = Object.assign({}, copy.quays[index], {
        description: description,
      });
      break;
    default:
      throw new Error("element not supported", type);
  }
  return copy;
};

helpers.mapNeighbourQuaysToClient = (original, payload, resourceId) => {
  let neighbourQuaysMap = { ...original } || {};

  if (!payload || !payload.length) return neighbourQuaysMap;

  const rootStopPlace = payload[0];
  let stopPlace = null;

  // root element in possible multimodal structure is the one requested
  if (rootStopPlace && rootStopPlace.id === resourceId) {
    stopPlace = rootStopPlace;
  } else if (rootStopPlace.children) {
    // find child with resourceId and its quays
    stopPlace = rootStopPlace.children.find((stop) => stop.id === resourceId);
  } else {
    console.info("StopPlace is not found, ignoring getting quays");
    return original;
  }

  neighbourQuaysMap[stopPlace.id] = stopPlace.quays.map((quay) => {
    let clientQuay = {};

    clientQuay.id = quay.id;

    if (quay.geometry && quay.geometry.legacyCoordinates) {
      let coordinates = quay.geometry.legacyCoordinates[0].slice();
      clientQuay.location = [
        setDecimalPrecision(coordinates[1], 6),
        setDecimalPrecision(coordinates[0], 6),
      ];
    }

    if (quay.privateCode && quay.privateCode.value) {
      clientQuay.privateCode = quay.privateCode.value;
    }

    clientQuay.publicCode = quay.publicCode;
    clientQuay.compassBearing = quay.compassBearing;

    return clientQuay;
  });

  return neighbourQuaysMap;
};

helpers.addAltName = (original, payload) => {
  const { nameType, lang, value } = payload;
  const copy = JSON.parse(JSON.stringify(original));

  if (!copy.alternativeNames) {
    copy.alternativeNames = [];
  }

  copy.alternativeNames.push({
    nameType: nameType,
    name: {
      lang: lang,
      value: value,
    },
  });
  return copy;
};

helpers.editAltName = (original, payload) => {
  const { nameType, lang, value, id } = payload;
  const copy = JSON.parse(JSON.stringify(original));

  if (!copy.alternativeNames) {
    copy.alternativeNames = [];
  }
  copy.alternativeNames[id] = {
    nameType: nameType,
    name: {
      lang: lang,
      value: value,
    },
  };
  return copy;
};

helpers.changeParkingName = (original, payload) => {
  const { index, name } = payload;
  const copy = JSON.parse(JSON.stringify(original));
  copy.parking[index].name = name;
  return copy;
};

helpers.changeParkingLayout = (original, payload) => {
  const { index, parkingLayout } = payload;
  const copy = JSON.parse(JSON.stringify(original));
  copy.parking[index].parkingLayout = parkingLayout;
  return copy;
};

helpers.changeParkingPaymentProcess = (original, payload) => {
  const { index, parkingPaymentProcess } = payload;
  const copy = JSON.parse(JSON.stringify(original));
  copy.parking[index].parkingPaymentProcess = parkingPaymentProcess;
  return copy;
};

helpers.changeParkingRechargingAvailable = (original, payload) => {
  const { index, rechargingAvailable } = payload;
  const copy = JSON.parse(JSON.stringify(original));
  copy.parking[index].rechargingAvailable = rechargingAvailable;
  return copy;
};

helpers.changeParkingNumberOfSpaces = (original, payload) => {
  const { index, numberOfSpaces } = payload;
  const copy = JSON.parse(JSON.stringify(original));
  copy.parking[index].numberOfSpaces = numberOfSpaces;
  return copy;
};

helpers.changeParkingNumberOfSpacesWithRechargePoint = (original, payload) => {
  const { index, numberOfSpacesWithRechargePoint } = payload;
  const copy = JSON.parse(JSON.stringify(original));
  copy.parking[index].numberOfSpacesWithRechargePoint =
    numberOfSpacesWithRechargePoint;
  return copy;
};

helpers.changeParkingNumberOfSpacesForRegisteredDisabledUserType = (
  original,
  payload,
) => {
  const { index, numberOfSpacesForRegisteredDisabledUserType } = payload;
  const copy = JSON.parse(JSON.stringify(original));
  copy.parking[index].numberOfSpacesForRegisteredDisabledUserType =
    numberOfSpacesForRegisteredDisabledUserType;
  return copy;
};

helpers.changeParkingTotalCapacity = (original, payload) => {
  const { index, totalCapacity } = payload;
  const copy = JSON.parse(JSON.stringify(original));
  copy.parking[index].totalCapacity = Number(totalCapacity);
  return copy;
};

helpers.updateCurrentStopWithWeighting = (stopPlace, payload) => {
  const copy = JSON.parse(JSON.stringify(stopPlace));
  copy.weighting = payload;
  return copy;
};

helpers.removeAltName = (original, index) => {
  const copy = JSON.parse(JSON.stringify(original));

  if (!copy.alternativeNames) {
    return original;
  }
  copy.alternativeNames = removeElementByIndex(copy.alternativeNames, index);

  return copy;
};

const removeElementByIndex = (list, index) => [
  ...list.slice(0, index),
  ...list.slice(index + 1),
];

export default helpers;
