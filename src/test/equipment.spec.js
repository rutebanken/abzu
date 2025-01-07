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

import helpers from "../modelUtils/equipmentHelpers";
import equiptedStopPlace from "./mock/equippedStopPlace";
import unequiptedStopPlace from "./mock/unequippedStopPlace";

import { simplifyPlaceEquipment } from "../models/stopPlaceUtils";

/* Simplify placeEquipment to client model */
equiptedStopPlace.placeEquipments = simplifyPlaceEquipment(
  equiptedStopPlace.placeEquipments,
);

describe("equipment helper", () => {
  test("should give binary representation of ticket machine based on data", () => {
    const first = helpers.getTicketMachineState(equiptedStopPlace);
    expect(first).toEqual(true);

    const second = helpers.getTicketMachineState(unequiptedStopPlace);
    expect(second).toEqual(false);
  });

  test("should give binary representation of shelterEquipment based on data", () => {
    const first = helpers.getShelterEquipmentState(equiptedStopPlace);
    expect(first).toEqual(true);

    const second = helpers.getShelterEquipmentState(unequiptedStopPlace);
    expect(second).toEqual(false);
  });

  test("should give binary representation of sanitaryEquipment based on data", () => {
    const first = helpers.getSanitaryEquipmentState(equiptedStopPlace);
    expect(first).toEqual(true);

    const second = helpers.getSanitaryEquipmentState(unequiptedStopPlace);
    expect(second).toEqual(false);
  });

  test("should give binary representation of waitingRoom based on data", () => {
    const first = helpers.getWaitingRoomState(equiptedStopPlace);
    expect(first).toEqual(true);

    const second = helpers.getWaitingRoomState(unequiptedStopPlace);
    expect(second).toEqual(false);
  });

  test("should give binary representation of cycleStorageEquipment based on data", () => {
    const first = helpers.getCycleStorageEquipment(equiptedStopPlace);
    expect(first).toEqual(true);

    const second = helpers.getCycleStorageEquipment(unequiptedStopPlace);
    expect(second).toEqual(false);
  });

  test("should give binary representation of sign512Equipment based on data", () => {
    const first = helpers.get512SignEquipment(equiptedStopPlace);
    expect(first).toEqual(true);

    const second = helpers.get512SignEquipment(unequiptedStopPlace);
    expect(second).toEqual(false);
  });

  test("should enable sign512Equipment prop for signEquipment on StopPlace based on data", () => {
    const payloadTrue = {
      state: true,
      type: "stopPlace",
      id: null,
    };

    let stopPlace = helpers.update512SignEquipment(
      unequiptedStopPlace,
      payloadTrue,
    );

    const equipted = helpers.get512SignEquipment(stopPlace);
    expect(equipted).toEqual(true);
  });

  test("should disable sign512Equipment prop for signEquipment on StopPlace based on data", () => {
    const payloadFalse = {
      state: false,
      type: "stopPlace",
      id: null,
    };
    let stopPlace = helpers.update512SignEquipment(
      equiptedStopPlace,
      payloadFalse,
    );
    const unequipted = helpers.get512SignEquipment(stopPlace);
    expect(unequipted).toEqual(false);
  });

  test("should enable sign512Equipment prop for signEquipment on Quayx based on data and index", () => {
    let unEquiptedWith512Sign = {
      quays: [],
    };

    for (let i = 0; i < 3; i++) {
      unEquiptedWith512Sign.quays.push(unequiptedStopPlace);
    }

    let equiptedWith512 = helpers.get512SignEquipment(
      unEquiptedWith512Sign.quays[0],
    );
    expect(equiptedWith512).toEqual(false);

    const payloadTrue = {
      state: true,
      type: "quay",
      id: 1,
    };

    let stopPlace = helpers.update512SignEquipment(
      unEquiptedWith512Sign,
      payloadTrue,
    );

    const equiptedQuay = helpers.get512SignEquipment(stopPlace.quays[1]);
    const unEquiptedQuay = helpers.get512SignEquipment(stopPlace.quays[0]);
    expect(equiptedQuay).toEqual(true);
    expect(unEquiptedQuay).toEqual(false);
  });
});
