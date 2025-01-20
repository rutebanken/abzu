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

export default {
  placeEquipments: {
    waitingRoomEquipment: [
      {
        seats: 4,
        heated: true,
        stepFree: true,
      },
    ],
    sanitaryEquipment: [
      {
        numberOfToilets: 8,
        gender: "both",
      },
    ],
    ticketingEquipment: [
      {
        ticketOffice: true,
        ticketMachines: true,
        numberOfMachines: 7,
      },
    ],
    cycleStorageEquipment: [
      {
        numberOfSpaces: 25,
        cycleStorageType: "racks",
      },
    ],
    shelterEquipment: [
      {
        seats: 4,
        stepFree: true,
      },
    ],
    generalSign: [
      {
        id: "NSR:GeneralSign:45434",
        privateCode: {
          type: null,
          value: "512",
        },
        signContentType: "transportMode",
      },
      {
        id: "NSR:GeneralSign:45435",
        privateCode: null,
        signContentType: null,
      },
    ],
  },
};
