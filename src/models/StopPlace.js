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

import { getAssessmentSetBasedOnQuays } from "../modelUtils/limitationHelpers";
import { hasExpired, isFuture } from "../modelUtils/validBetween";
import { setDecimalPrecision } from "../utils/";
import { Entities } from "./Entities";
import Quay from "./Quay";
import {
  extractAlternativeNames,
  getImportedId,
  simplifyPlaceEquipment,
} from "./stopPlaceUtils";

class StopPlace {
  constructor(stop, isActive, parking, userDefinedCoordinates) {
    this.stop = stop;
    this.isActive = isActive;
    this.parking = parking;
    this.userDefinedCoordinates = userDefinedCoordinates;
  }

  toClient() {
    try {
      const { stop, isActive, parking, userDefinedCoordinates } = this;

      let clientStop = {
        alternativeNames: extractAlternativeNames(stop.alternativeNames),
        hasExpired: hasExpired(stop.validBetween),
        isFuture: isFuture(stop.validBetween),
        id: stop.id,
        isActive: isActive,
        name: stop.name ? stop.name.value : "",
        stopPlaceType: stop.stopPlaceType,
        submode: stop.submode,
        tags: stop.tags,
        transportMode: stop.transportMode,
        version: stop.version,
        weighting: stop.weighting,
        adjacentSites: stop.adjacentSites,
        entityType: Entities.STOP_PLACE,
        permanentlyTerminated: stop.modificationEnumeration === "delete",
        permissions: stop.permissions,
      };

      if (stop.groups && stop.groups.length) {
        clientStop.groups = stop.groups.map((group) => {
          let newGroup = { ...group };
          newGroup.name =
            group.name && group.name.value ? group.name.value : "";
          return newGroup;
        });
        clientStop.belongsToGroup = true;
      } else {
        clientStop.groups = [];
        clientStop.belongsToGroup = false;
      }

      if (stop.topographicPlace) {
        if (stop.topographicPlace.name) {
          clientStop.topographicPlace = stop.topographicPlace.name.value;
        }
        if (
          stop.topographicPlace.parentTopographicPlace &&
          stop.topographicPlace.parentTopographicPlace.name
        ) {
          clientStop.parentTopographicPlace =
            stop.topographicPlace.parentTopographicPlace.name.value;
        }
      }

      if (stop.validBetween) {
        clientStop.validBetween = stop.validBetween;
      }

      if (stop.tariffZones && stop.tariffZones.length) {
        clientStop.tariffZones = stop.tariffZones.map((zone) => {
          if (zone.name && zone.name.value) {
            return {
              name: zone.name.value,
              id: zone.id,
            };
          }
          return undefined;
        });
      } else {
        clientStop.tariffZones = [];
      }

      if (stop.fareZones && stop.fareZones.length) {
        clientStop.fareZones = stop.fareZones.map((zone) => {
          return {
            name: zone.name?.value,
            privateCode: zone.privateCode?.value,
            id: zone.id,
          };
        });
      } else {
        clientStop.fareZones = [];
      }

      clientStop.accessibilityAssessment = stop.accessibilityAssessment
        ? stop.accessibilityAssessment
        : getAssessmentSetBasedOnQuays(stop.quays);

      if (stop.publicCode) {
        clientStop.publicCode = stop.publicCode;
      }

      if (stop.privateCode) {
        clientStop.privateCode = stop.privateCode.value;
      }

      if (stop.description) {
        clientStop.description = stop.description.value;
      }

      if (stop.placeEquipments) {
        clientStop.placeEquipments = simplifyPlaceEquipment(
          stop.placeEquipments,
        );
      }

      if (stop.geometry && stop.geometry.legacyCoordinates) {
        let coordinates = stop.geometry.legacyCoordinates[0].slice();
        // Leaflet uses latLng, GeoJSON [long,lat]
        clientStop.location = [
          setDecimalPrecision(coordinates[1], 6),
          setDecimalPrecision(coordinates[0], 6),
        ];
      } else {
        if (
          userDefinedCoordinates &&
          stop.id === userDefinedCoordinates.stopPlaceId &&
          userDefinedCoordinates.position
        ) {
          clientStop.location = userDefinedCoordinates.position.slice();
        }
      }

      if (stop.keyValues) {
        clientStop.importedId = getImportedId(stop.keyValues);
        clientStop.keyValues = stop.keyValues;
      }

      if (isActive) {
        clientStop.quays = [];
        clientStop.parking = parking || [];

        if (stop.quays) {
          clientStop.quays = stop.quays
            .map((item) =>
              new Quay(item, clientStop.accessibilityAssessment).toClient(),
            )
            .sort((a, b) => (a.publicCode || "") - b.publicCode || "");
        }
      }
      return clientStop;
    } catch (e) {
      console.log("error", e);
    }
  }
}

export default StopPlace;
