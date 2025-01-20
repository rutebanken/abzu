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

import gql from "graphql-tag";
import Fragments from "./fragments";

export const neighbourStopPlaceQuays = gql`
  query neighbourStopPlaceQuays($id: String!) {
    stopPlace(id: $id) {
      id
      version
      ... on ParentStopPlace {
        children {
          id
          version
          adjacentSites {
            ref
          }
          quays {
            id
            version
            geometry {
              legacyCoordinates
            }
            compassBearing
            publicCode
            privateCode {
              value
            }
          }
        }
      }
      ... on StopPlace {
        id
        version
        adjacentSites {
          ref
        }
        quays {
          id
          version
          geometry {
            legacyCoordinates
          }
          compassBearing
          publicCode
          privateCode {
            value
          }
        }
      }
    }
  }
`;

export const stopPlaceBBQuery = gql`
  query stopPlaceBBox(
    $ignoreStopPlaceId: String
    $lonMin: BigDecimal!
    $lonMax: BigDecimal!
    $latMin: BigDecimal!
    $latMax: BigDecimal!
    $includeExpired: Boolean
  ) {
    stopPlaceBBox(
      ignoreStopPlaceId: $ignoreStopPlaceId
      latMin: $latMin
      latMax: $latMax
      lonMin: $lonMin
      lonMax: $lonMax
      size: 500
      includeExpired: $includeExpired
    ) {
      id
      version
      geometry {
        legacyCoordinates
      }
      name {
        value
        lang
      }
      topographicPlace {
        id
        name {
          value
        }
        topographicPlaceType
      }
      validBetween {
        fromDate
        toDate
      }
      modificationEnumeration
      ... on StopPlace {
        __typename
        stopPlaceType
        submode
        permissions {
          ...EntityPermissions
        }
      }
      ... on ParentStopPlace {
        children {
          id
          version
          stopPlaceType
          submode
          geometry {
            legacyCoordinates
          }
          topographicPlace {
            id
            name {
              value
            }
          }
          permissions {
            ...EntityPermissions
          }
        }
      }
    }
  }
  ${Fragments.entityPermissions}
`;

export const allEntities = gql`
    query stopPlaceAndPathLink($id: String!) {
        __typename
        pathLink(stopPlaceId: $id) {
            ...VerbosePathLink
        },
        stopPlace(id: $id, versionValidity: MAX_VERSION) {
            ...VerboseStopPlace
            ...VerboseParentStopPlace
        }
        parking: parking(stopPlaceId: $id) {
            ...VerboseParking
        },
        versions:
            stopPlace(id: $id, allVersions: true, size: 100) {
                    id
                    validBetween {
                        fromDate
                        toDate
                    }
                    name {
                        value
                        lang
                    }
                    version
                    versionComment
                    changedBy
                    ...on ParentStopPlace {
                        children {
                            id
                            validBetween {
                                fromDate
                                toDate
                            }
                            name {
                                value
                                lang
                            }
                            version
                            versionComment
                            changedBy
                        }
                    }
                }
        },
    ${Fragments.stopPlace.verbose},
    ${Fragments.parentStopPlace.verbose},
    ${Fragments.pathLink.verbose},
    ${Fragments.parking.verbose},
`;

export const getStopById = gql`
  query getStopById($id: String!) {
    stopPlace(id: $id) {
      id
      version
      __typename
      keyValues {
        key
        values
      }
      name {
        value
        lang
      }
      groups {
        id
        name {
          value
        }
      }
      tags {
        name
        comment
        created
        createdBy
      }
      geometry {
        legacyCoordinates
      }
      validBetween {
        fromDate
        toDate
      }
      accessibilityAssessment {
        limitations {
          wheelchairAccess
        }
      }
      modificationEnumeration
      topographicPlace {
        id
        name {
          value
        }
        topographicPlaceType
        parentTopographicPlace {
          id
          name {
            value
          }
        }
      }
      ... on StopPlace {
        adjacentSites {
          ref
        }
        stopPlaceType
        submode
        transportMode
        quays {
          id
          importedId
          publicCode
          privateCode {
            value
          }
        }
        permissions {
          ...EntityPermissions
        }
      }
      ... on ParentStopPlace {
        permissions {
          ...EntityPermissions
        }
        geometry {
          legacyCoordinates
          type
        }
        children {
          name {
            value
            lang
          }
          id
          version
          importedId
          stopPlaceType
          transportMode
          submode
          geometry {
            legacyCoordinates
          }
          permissions {
            ...EntityPermissions
          }
        }
      }
    }
  }
  ${Fragments.entityPermissions}
`;

export const findStop = gql`
  query findStop(
    $query: String
    $municipalityReference: [String]
    $stopPlaceType: [StopPlaceType]
    $countyReference: [String]
    $countryReference: [String]
    $pointInTime: DateTime
    $versionValidity: VersionValidity
  ) {
    groupOfStopPlaces(query: $query, size: 7) {
      id
      name {
        value
      }
      permissions {
        canEdit
      }
      members {
        __typename
        id
        version
        name {
          value
        }
        geometry {
          type
          legacyCoordinates
        }
        topographicPlace {
          id
          name {
            value
          }
          parentTopographicPlace {
            id
            name {
              value
            }
          }
        }
        ... on StopPlace {
          submode
          version
          stopPlaceType
          permissions {
            canEdit
          }
        }
      }
    }
    stopPlace(
      query: $query
      municipalityReference: $municipalityReference
      stopPlaceType: $stopPlaceType
      countyReference: $countyReference
      countryReference: $countryReference
      size: 7
      pointInTime: $pointInTime
      versionValidity: $versionValidity
    ) {
      id
      version
      groups {
        id
        name {
          value
        }
      }
      __typename
      keyValues {
        key
        values
      }
      name {
        value
      }
      tags {
        name
        comment
        created
        createdBy
      }
      geometry {
        legacyCoordinates
      }
      validBetween {
        fromDate
        toDate
      }
      accessibilityAssessment {
        limitations {
          wheelchairAccess
        }
      }
      topographicPlace {
        id
        name {
          value
        }
        topographicPlaceType
        parentTopographicPlace {
          id
          name {
            value
          }
        }
      }
      modificationEnumeration
      permissions {
        canEdit
      }
      ... on StopPlace {
        stopPlaceType
        submode
        transportMode
        quays {
          id
          importedId
          publicCode
          privateCode {
            value
          }
        }
      }
      ... on ParentStopPlace {
        geometry {
          legacyCoordinates
          type
        }
        children {
          id
          version
          name {
            value
          }
          importedId
          stopPlaceType
          transportMode
          submode
          geometry {
            legacyCoordinates
          }
          permissions {
            canEdit
          }
        }
      }
    }
  }
`;

export const findStopForReport = gql`
    query findStopForReport($query: String, $importedId: String, $municipalityReference: [String], $stopPlaceType: [StopPlaceType], $countyReference: [String], $countryReference: [String], $withoutLocationOnly: Boolean!, $withDuplicateImportedIds: Boolean!, $pointInTime: DateTime, $withNearbySimilarDuplicates: Boolean, $hasParking: Boolean, $tags: [String], $withTags: Boolean, $versionValidity: VersionValidity) {
        stopPlace(query: $query, importedId: $importedId, municipalityReference: $municipalityReference, stopPlaceType: $stopPlaceType, countyReference: $countyReference, countryReference: $countryReference, withoutLocationOnly: $withoutLocationOnly, withDuplicatedQuayImportedIds: $withDuplicateImportedIds, pointInTime: $pointInTime, size: 300, withNearbySimilarDuplicates: $withNearbySimilarDuplicates, hasParking:$hasParking, tags: $tags, withTags: $withTags, versionValidity: $versionValidity) {
            ...on StopPlace {
                ...ReportStopPlace
            }
            ...on ParentStopPlace {
                ...ReportParentStopPlace
            }
        }
    },
  ${Fragments.stopPlace.reportView},
  ${Fragments.parentStopPlace.reportView}
`;

export const allVersionsOfStopPlace = gql`
  query stopPlaceAllVersions($id: String!) {
    versions: stopPlace(id: $id, allVersions: true, size: 100) {
      id
      ... on StopPlace {
        validBetween {
          fromDate
          toDate
        }
        name {
          value
          lang
        }
        changedBy
        version
        versionComment
      }
      ... on ParentStopPlace {
        validBetween {
          fromDate
          toDate
        }
        name {
          value
          lang
        }
        changedBy
        version
        versionComment
      }
    }
  }
`;

export const getTagsQuery = gql`
  query getTagsQuery($idReference: String!) {
    stopPlace(id: $idReference) {
      __typename
      id
      version
      tags {
        name
        comment
        created
        createdBy
        idReference
      }
    }
  }
`;

export const getTagsByNameQuery = gql`
  query getTagsByNameQuery($name: String!) {
    tags(name: $name) {
      name
    }
  }
`;

export const findTagByNameQuery = gql`
  query findTagByName($name: String!) {
    tags(name: $name) {
      name
      comment
      created
      createdBy
      idReference
    }
  }
`;

export const stopPlaceAndPathLinkByVersion = gql`
    query stopPlaceAndPathLink($id: String!, $version: Int) {
        pathLink(stopPlaceId: $id) {
            ...VerbosePathLink
        },
        stopPlace(id: $id, version: $version) {
            ...VerboseStopPlace
            ...VerboseParentStopPlace
        }
        parking: parking(stopPlaceId: $id) {
            ...VerboseParking
        }
        versions:
        stopPlace(id: $id, allVersions: true, size: 100) {
            id
            validBetween {
                fromDate
                toDate
            }
            name {
                value
                lang
            }
            version
            versionComment
            changedBy
        }
    },
    ${Fragments.stopPlace.verbose},
    ${Fragments.parentStopPlace.verbose},
    ${Fragments.pathLink.verbose},
    ${Fragments.parking.verbose}
`;

export const topopGraphicalPlacesQuery = gql`
  query TopopGraphicalPlaces($query: String!) {
    topographicPlace(query: $query) {
      id
      name {
        value
      }
      topographicPlaceType
      parentTopographicPlace {
        id
        name {
          value
        }
      }
    }
  }
`;

export const topopGraphicalPlacesReportQuery = gql`
  query TopopGraphicalPlacesForReport($query: String!) {
    topographicPlace(query: $query) {
      id
      name {
        value
      }
      topographicPlaceType
      parentTopographicPlace {
        id
        name {
          value
        }
      }
    }
  }
`;

export const getMergeInfoStopPlace = gql`
  query MergeInfoStopPlace($stopPlaceId: String!) {
    stopPlace(id: $stopPlaceId) {
      id
      version
      ... on StopPlace {
        quays {
          id
          privateCode {
            value
          }
          compassBearing
          publicCode
        }
      }
    }
  }
`;

export const getParkingForMultipleStopPlaces = (stopPlaceIds) => {
  const stopPlaces = stopPlaceIds.map((id) => ({
    id,
    alias: id.replace(window.config.netexPrefix + ":StopPlace:", "StopPlace"),
  }));

  let queryContent = "";

  stopPlaces.forEach((stopPlace) => {
    queryContent += `
      ${stopPlace.alias}: parking(stopPlaceId: "${stopPlace.id}") {
        id
        parkingVehicleTypes
      }
    `;
  });

  return gql`
    query ParkingForMultipleStopPlaces {
      ${queryContent}
    }
  `;
};

export const getStopPlacesById = (stopPlaceIds) => {
  const stopPlaces = stopPlaceIds.map((id) => ({
    id,
    alias: id.replace(window.config.netexPrefix + ":StopPlace:", "StopPlace"),
  }));

  let queryContent = "";

  stopPlaces.forEach((stopPlace) => {
    queryContent += `
        ${stopPlace.alias}: stopPlace(id: "${stopPlace.id}") {
            ...on StopPlace {
                __typename
                id
                version
                name {
                    value
                }
                submode
                geometry {
                  legacyCoordinates
                }
                transportMode
                stopPlaceType
                adjacentSites {
                    ref
                }
                quays {
                    id
                    publicCode
                    privateCode {
                        value
                    }
                }
            }
            ...on ParentStopPlace {
                __typename
                id
                version
                name {
                    value
                }
                geometry {
                  legacyCoordinates
                }
                children {
                    id
                    transportMode
                    stopPlaceType
                    submode
                    geometry {
                      legacyCoordinates
                    }
                }
            }
        }
    `;
  });

  return gql`
      query getAddStopPlaceInfo {
          ${queryContent}
      }
  `;
};

export const getQueryTopographicPlaces = (ids) => {
  let queryContent = "";

  ids.forEach((id) => {
    let alias = id.replace(":", "").replace(":", "");

    queryContent += `
        ${alias}: topographicPlace(id: "${id}") {
          id
          name {
          value
          }
          topographicPlaceType
          parentTopographicPlace {
          id
          name {
            value
          }
        }
      }
    `;
  });

  return gql`
    query topographicPlacesForQuery {
      ${queryContent}
    }
  `;
};

export const getGroupOfStopPlaceQuery = gql`
  query getGroupOfStopPlaces($id: String!) {
    groupOfStopPlaces(id: $id) {
      ...GroupOfStopPlaces
    }
  }
  ${Fragments.groupOfStopPlaces.verbose}
`;

export const findTariffZonesByIds = gql`
  query findTariffZonesByIds($ids: [String]) {
    tariffZones(ids: $ids) {
      id
      name {
        value
      }
      polygon {
        type
        legacyCoordinates
      }
    }
  }
`;

export const findFareZones = gql`
  query findFareZones($ids: [String]) {
    fareZones(ids: $ids) {
      id
      privateCode {
        value
      }
      name {
        value
      }
      polygon {
        type
        legacyCoordinates
      }
    }
  }
`;

export const findTariffZonesForFilter = gql`
  query findTariffZonesForFilter {
    tariffZones {
      id
      name {
        value
      }
    }
  }
`;

export const findFareZonesForFilter = gql`
  query findFareZonesForFilter {
    fareZones {
      id
      privateCode {
        value
      }
      name {
        value
      }
    }
  }
`;

export const getLocationPermissions = gql`
  query getLocationPermissions(
    $longitude: BigDecimal!
    $latitude: BigDecimal!
  ) {
    locationPermissions(longitude: $longitude, latitude: $latitude) {
      allowedStopPlaceTypes
      allowedSubmodes
      bannedStopPlaceTypes
      bannedSubmodes
      canDelete
      canEdit
    }
  }
`;

export const getUserPermissionsQuery = gql`
  query getUserPermissions {
    userPermissions {
      allowNewStopEverywhere
      isGuest
    }
  }
`;
