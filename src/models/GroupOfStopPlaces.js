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

import { calculatePolygonCenter } from "../utils/mapUtils";
import { Entities } from "./Entities";
import ParentStopPlace from "./ParentStopPlace";
import StopPlace from "./StopPlace";

class GroupOfStopPlace {
  constructor(data) {
    this.data = data;
  }

  getTopographicPlacesFromMembers(members = []) {
    if (!members.length) return [];

    return [
      ...new Set(
        members
          .filter(
            ({ topographicPlace, parentTopographicPlace }) =>
              topographicPlace && parentTopographicPlace,
          )
          .map(({ topographicPlace, parentTopographicPlace }) =>
            JSON.stringify({
              topographicPlace,
              parentTopographicPlace,
            }),
          ),
      ),
    ].map((member) => JSON.parse(member));
  }

  toClient() {
    try {
      const { data } = this;

      let clientGroup = {
        description: data.description ? data.description.value : "",
        entityType: Entities.GROUP_OF_STOP_PLACE,
        id: data.id,
        name: data.name ? data.name.value : "",
        permissions: data.permissions,
        members: data.members.map((member) => {
          const isParent = member["__typename"] === "ParentStopPlace";
          if (isParent) {
            let parentStopPlace = new ParentStopPlace(member, true).toClient();
            parentStopPlace.isMemberOfGroup = true;
            return parentStopPlace;
          } else {
            let stopPlace = new StopPlace(member, true).toClient();
            stopPlace.isMemberOfGroup = true;
            return stopPlace;
          }
        }),
      };

      clientGroup.topographicPlaces = this.getTopographicPlacesFromMembers(
        clientGroup.members,
      );

      clientGroup.location = calculatePolygonCenter(clientGroup.members);

      return clientGroup;
    } catch (e) {
      console.log("error", e);
    }
  }
}

export default GroupOfStopPlace;
