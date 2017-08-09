import roleParser, { getRoleOptions, isModeOptionsValidForMode, isInArrayIgnoreCase } from '../roles/rolesParser';
import { getIn } from '../utils/';
import stopTypes, { submodes } from '../models/stopTypes';

export const getAllowanceInfoForStop = (result, tokenParsed) => {
  /* find all roles that allow editing of stop */
  const token = { ... tokenParsed };
  const editStopRoles = roleParser.getEditStopRoles(token);
  const deleteStopRoles = roleParser.getDeleteStopRoles(token);
  const latlng = getLatLngFromResult(result);
  const editStopRolesGeoFiltered = roleParser.filterRolesByZoneRestriction(
    editStopRoles,
    latlng
  );

  const stopPlace = getStopPlace(result);

  if (!stopPlace) {
    return {
      roles: [],
      legalStopPlaceTypes: [],
      legalSubmodes: [],
      canEdit: false
    }
  }

  // retrieve all roles that allow editing a given stop
  const responsibleEditRoles = roleParser.filterRolesByEntityModes(editStopRolesGeoFiltered, stopPlace);

  // retrieve all roles that allow hard-deleting a given stop
  const responsibleDeleteRoles = roleParser.filterRolesByEntityModes(deleteStopRoles, stopPlace);

  const canEdit = responsibleEditRoles.length > 0;
  const canDeleteStop = responsibleDeleteRoles.length > 0;

  let legalStopPlaceTypes = [];
  let legalSubmodes = [];

  const stopPlaceTypesFoundinRoles = getLegalStopPlaceTypes(editStopRolesGeoFiltered);
  const submodesFoundinRoles = getLegalSubmodes(responsibleEditRoles);

  if (canEdit) {
    legalStopPlaceTypes = restrictModeByRoles(editStopRolesGeoFiltered, stopPlaceTypesFoundinRoles, 'StopPlaceType');
    legalSubmodes = submodesFoundinRoles;
  }

  return {
    roles: responsibleEditRoles,
    legalStopPlaceTypes,
    legalSubmodes,
    blacklistedStopPlaceTypes: getBlacklistedStopPlaceTypes(responsibleEditRoles),
    canEdit,
    canDeleteStop
  };
};


const restrictModeByRoles = (roles, modes, entityType) => {

  let foundEditStops = false;
  let result = new Set();
  let blacklistedSet = new Set();

  roles.forEach(role => {

    if (role.r === 'editStops') {
      foundEditStops = true;
    }

    if (role.e && role.e[entityType] && role.e[entityType].length) {
      modes.forEach( mode => {

        (role.e[entityType] || []).forEach( roleMode => {

          const isBlacklisted = roleMode.indexOf('!') > -1;

          // only add if whitelisted or whitelisted
          if (!isBlacklisted && roleMode === mode || roleMode === '*') {
            result.add(mode);
          } else {
            const blacklistedEntity = roleMode.substring(1);
            blacklistedSet.add(blacklistedEntity);
          }
        })
      });
    }
  });

  if (foundEditStops) {

    // add all other as withlisted for entities that are blacklisted
    Array.from(blacklistedSet).forEach( b => {
      modes.forEach( m => {
        if (b !== m) {
          result.add(m);
        }
      });
    });

    // cleanup by removing all blacklisted
    Array.from(blacklistedSet).forEach( b => {
      result.delete(b);
    });

    return Array.from(result);
  }

  return [];
};

export const getAllowInfoNewStop = (latlng, tokenParsed) => {
  const token = { ... tokenParsed };
  let editStopRoles = roleParser.getEditStopRoles(token);
  let rolesAllowingGeo = roleParser.filterRolesByZoneRestriction(
    editStopRoles,
    latlng
  );
  return {
    legalStopPlaceTypes: getLegalStopPlaceTypes(rolesAllowingGeo),
    legalSubmodes: getLegalSubmodes(rolesAllowingGeo),
    canEdit: true,
  }
}

export const getLegalSubmodes = roles => {
  return filterByLegalMode(roles, submodes, 'Submode');
}

const filterByLegalMode = (roles, completeList, key) => {
  let typesFoundInRoles = new Set();

  for (let i = 0; i < roles.length; i++) {
    let role = roles[i];
    if (role.e[key] && role.e[key].length) {
      for (let i = 0; i < role.e[key].length; i++) {
        let entityType = role.e[key][i];
        if (entityType === '*') {
          return completeList;
        } else {
          typesFoundInRoles.add(entityType);
        }
      }
    } else {
      return [];
    }
  }

  const options = getRoleOptions(Array.from(typesFoundInRoles), completeList);

  return completeList.filter( entityType => isModeOptionsValidForMode(options, entityType));
}

export const getLegalStopPlaceTypes = roles => {
  let allStopTypes = stopTypes.en.map(stopType => stopType.value);
  return filterByLegalMode(roles, allStopTypes, 'StopPlaceType')
}

const getBlacklistedStopPlaceTypes = roles => {

  const blacklistSet = new Set();

  const stopPlaceRoles = roles.map(role => {
    if (role.e && role.e.EntityType) {
      if (
        isInArrayIgnoreCase(role.e.EntityType, 'stopPlace') ||
        isInArrayIgnoreCase(role.e.EntityType, '*')
      ) {
        return getRoleOptions(role.e.StopPlaceType);
      }
    };
  });

  stopPlaceRoles.forEach( role => {
    role.blacklisted.forEach( b => {
      if (b) {
        blacklistSet.add(b);
      }
    })
  });

  return Array.from(blacklistSet);
}

export const getAllowanceSearchInfo = (payLoad, tokenParsed) => {
  const token = { ... tokenParsed };
  let editStopRoles = roleParser.getEditStopRoles(token);
  let latlng = payLoad.location;
  let rolesAllowingGeo = roleParser.filterRolesByZoneRestriction(
    editStopRoles,
    latlng
  );

  let finalRoles = roleParser.filterRolesByEntityModes(rolesAllowingGeo, payLoad);

  return {
    roles: finalRoles,
    canEdit: finalRoles.length > 0
  };
}

export const getLatLngFromResult = result => {

  let stopPlace = getStopPlace(result);

  if (!stopPlace) {
    return null;
  }

  let lngLat = getIn(stopPlace, ['geometry', 'coordinates'], null);

  if (!lngLat || !lngLat.length) return null;

  let latLng = lngLat[0].slice().reverse();

  return latLng;
};

export const getStopPlace = result => {

  if (!result || !result.data || !result.data.stopPlace) {
    return null;
  }

  if (!result.data.stopPlace.length) {
    return null;
  }

  let stopPlace = result.data.stopPlace[0];

  if (stopPlace) {
    return JSON.parse(JSON.stringify(stopPlace));
  }

  return null;
}

