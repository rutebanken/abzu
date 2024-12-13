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

import stopTypes from "./stopTypes";

export const submodes = [
  "airportLinkBus",
  "expressBus",
  "localBus",
  "nightBus",
  "railReplacementBus",
  "regionalBus",
  "schoolBus",
  "shuttleBus",
  "sightseeingBus",
  "localTram",
  "internationalRail",
  "interregionalRail",
  "local",
  "longDistance",
  "nightRail",
  "regionalRail",
  "touristRailway",
  "metro",
  "domesticFlight",
  "helicopterService",
  "internationalFlight",
  "highSpeedPassengerService",
  "highSpeedVehicleService",
  "internationalCarFerry",
  "internationalPassengerFerry",
  "localCarFerry",
  "localPassengerFerry",
  "nationalCarFerry",
  "sightseeingService",
  "telecabin",
  "funicular",
];

export const getInverseSubmodesWhitelist = (whitelist) => {
  return submodes.filter((submode) => whitelist.indexOf(submode) === -1);
};

export const getStopPlacesForSubmodes = (legalSubmodes) => {
  let result = [];

  if (!legalSubmodes || !legalSubmodes.length) return result;

  const stopTypeKeys = Object.keys(stopTypes);

  for (let i = 0; i < stopTypeKeys.length; i++) {
    const stopType = stopTypes[stopTypeKeys[i]];
    const submodes = stopType.submodes || [];
    legalSubmodes.forEach((legalSubmode) => {
      if (submodes.indexOf(legalSubmode) > -1) {
        if (result.indexOf(stopTypeKeys[i]) === -1 && legalSubmode !== null) {
          result.push(stopTypeKeys[i]);
        }
      }
    });
  }
  return result;
  return stopPlace.permissions?.canEdit || false;
};
