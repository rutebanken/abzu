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
import { setDecimalPrecision } from "./";
const defaultCenterPosition = [64.349421, 16.809082];

export const getCentroid = (latlngs = [[]], originalCentroid) => {
  if (!latlngs.length) {
    return originalCentroid;
  }

  let polygon = L.polygon(latlngs);
  let center = polygon.getBounds().getCenter();

  if (center.lat && center.lng) {
    return [
      setDecimalPrecision(center.lat, 6),
      setDecimalPrecision(center.lng, 6),
    ];
  }

  return originalCentroid;
};

export const sortPolygonByAngles = (points) => {
  try {
    if (!points || !points.length || !points[0].length) return null;

    const polygon = L.polygon(points);

    const center = polygon.getBounds().getCenter();
    const { lat, lng } = center;

    return points[0].sort((posA, posB) => {
      const angleA = Math.atan2(posA[1] - lng, posA[0] - lat);
      const angleB = Math.atan2(posB[1] - lng, posB[0] - lat);
      return angleB - angleA;
    });
  } catch (exception) {
    console.error("sortPolygonByAngles", exception);
  }
};

export const calculatePolygonCenter = (members) => {
  if (!members || !members.length) {
    return defaultCenterPosition;
  }

  if (members.length === 1) {
    return members[0].location || defaultCenterPosition;
  }

  const points = [members.map((member) => member.location)];
  const polygon = L.polygon(points);
  const center = polygon.getBounds().getCenter();
  return [center.lat, center.lng];
};
