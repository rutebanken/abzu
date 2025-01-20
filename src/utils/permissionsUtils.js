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

import stopTypes from "../models/stopTypes";

const buildAllowanceInfo = (permissions) => {
  const canEdit = permissions.canEdit;
  const canDeleteStop = permissions.canDelete;

  let legalStopPlaceTypes = getLegalStopPlacesTypes(
    permissions.allowedStopPlaceTypes || [],
    permissions.bannedStopPlaceTypes || [],
  );
  let legalSubmodes = getLegalSubmodes(permissions);

  return {
    legalStopPlaceTypes,
    legalSubmodes,
    blacklistedStopPlaceTypes: permissions.bannedStopPlaceTypes || [],
    canEdit,
    canDeleteStop,
  };
};

const buildAllowanceInfoForStopPlace = (stopPlace) => {
  return buildAllowanceInfo(stopPlace.permissions);
};

export const getAllowanceInfoFromLocationPermissions = (
  locationPermissions,
) => {
  if (!locationPermissions) {
    return {
      canEdit: false,
      canDelete: false,
      legalStopPlaceTypes: [],
      legalSubmodes: [],
    };
  }
  return {
    canEdit: locationPermissions.canEdit,
    canDelete: locationPermissions.canDelete,
    legalStopPlaceTypes: getLegalStopPlacesTypes(
      locationPermissions.allowedStopPlaceTypes,
      locationPermissions.bannedStopPlaceTypes,
    ),
    legalSubmodes: getLegalSubmodes(locationPermissions),
  };
};

export const getLegalStopPlaceTypes = ({
  allowedStopPlaceTypes,
  bannedStopPlaceTypes,
}) => {
  return getLegalStopPlacesTypes(allowedStopPlaceTypes, bannedStopPlaceTypes);
};

export const getLegalStopPlacesTypes = (
  allowedStopPlaceTypes,
  bannedStopPlaceTypes,
) => {
  const allStopTypes = Object.keys(stopTypes);
  if (bannedStopPlaceTypes.includes("*")) {
    return [];
  }

  if (isWildcardOrEmpty(allowedStopPlaceTypes)) {
    return allStopTypes.filter((type) => !bannedStopPlaceTypes.includes(type));
  }

  return allowedStopPlaceTypes.filter(
    (type) => !bannedStopPlaceTypes.includes(type),
  );
};

const isWildcardOrEmpty = (list) => {
  return !list || list.length === 0 || (list.length > 0 && list[0] === "*");
};

const isStopTypeAllowed = (stopType, permissions) => {
  const { allowedStopPlaceTypes } = permissions;
  return (
    isWildcardOrEmpty(allowedStopPlaceTypes) ||
    allowedStopPlaceTypes.includes(stopType)
  );
};

const getSubmodesForStopType = (stopType, permissions) => {
  const { submodes } = stopTypes[stopType];
  if (!submodes) return [];

  if (permissions.bannedStopPlaceTypes.includes(stopType)) return [];
  if (!isStopTypeAllowed(stopType, permissions)) return [];

  return submodes;
};

const filterBySubmodePermissions = (submodes, permissions) => {
  const { allowedSubmodes, bannedSubmodes } = permissions;

  if (allowedSubmodes.includes("*"))
    return submodes.filter((type) => !bannedSubmodes.includes(type));
  if (bannedSubmodes.includes("*")) return [];

  if (allowedSubmodes.length > 0) {
    return submodes.filter(
      (type) =>
        allowedSubmodes.includes(type) && !bannedSubmodes.includes(type),
    );
  }

  return submodes.filter((type) => !bannedSubmodes.includes(type));
};

export const getLegalSubmodesForStopPlace = (stopPlace) => {
  return getLegalSubmodes(stopPlace.permissions);
};

export const getLegalSubmodes = (permissions) => {
  const applicableSubmodes = Object.keys(stopTypes).reduce(
    (acc, stopType) => [
      ...acc,
      ...getSubmodesForStopType(stopType, permissions),
    ],
    [],
  );

  return filterBySubmodePermissions(applicableSubmodes, permissions);
};

export const getStopPermissions = (stopPlace) => {
  if (!stopPlace?.permissions) {
    return {
      canEdit: false,
      canDelete: false,
      legalStopPlaceTypes: [],
      legalSubmodes: [],
    };
  }
  return buildAllowanceInfoForStopPlace(stopPlace);
};

export const isStopFromSearch = (state, stopId) => {
  if (!stopId) return false;

  return (
    state.stopPlace.searchResults?.some((result) => result.id === stopId) ||
    state.stopPlace.activeSearchResult?.id === stopId
  );
};
