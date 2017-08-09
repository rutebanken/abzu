import expect from 'expect';
import { isModeOptionsValidForMode, getRoleOptions } from '../roles/rolesParser';
import { getAllowanceInfoForStop , getLatLngFromResult, getLegalStopPlaceTypes, getLegalSubmodes } from '../reducers/rolesReducerUtils';
import stopTypes, { submodes } from '../models/stopTypes';
import mockRailReplacementStop from './mock/mockRailReplacementStop';
import mockRailStop from './mock/mockRailStop';
import { getSubModeRelevance } from '../roles/rolesParser';

const stopPlaceResult = {
  data: {
    stopPlace: [
      {
        geometry: {
          coordinates: [
            [
              10.434486,
              59.833343
            ]
          ]
        }
      }
    ]
  }
};

describe('User and roles - scenarios', () => {

  it('nsbEditStops - train and railReplacementBus - verify railReplacementBus ', () => {

    let token = {
      roles: [
        JSON.stringify({
          "r": "editStops",
          "o": "OST",
          "z": "01",
          "e": {
            "EntityType": [
              "StopPlace"
            ],
            "StopPlaceType": [
              "railStation"
            ],
            "Submode": [
              "railReplacementBus",
            ],
          }
        })
      ]
    };

    const allowanceInfo = getAllowanceInfoForStop(mockRailReplacementStop, token);
    expect(allowanceInfo.canEdit).toEqual(true);
  });

  it('nsbEditStops - train and railReplacementBus - verify railStation', () => {

    let token = {
      roles: [
        JSON.stringify({
          "r": "editStops",
          "o": "OST",
          "z": "01",
          "e": {
            "EntityType": [
              "StopPlace"
            ],
            "StopPlaceType": [
              "railStation"
            ],
            "Submode": [
              "railReplacementBus",
            ],
          }
        })
      ]
    };

    const allowanceInfo = getAllowanceInfoForStop(mockRailStop, token);
    expect(allowanceInfo.canEdit).toEqual(true);
  });

  it('nsbEditStops - train and railReplacementBus - verify railStation', () => {

    let token = {
      roles: [
        JSON.stringify({
          "r": "editStops",
          "o": "OST",
          "z": "01",
          "e": {
            "EntityType": [
              "StopPlace"
            ],
            "StopPlaceType": [
              "railStation"
            ],
            "Submode": [
              "railReplacementBus",
            ],
          }
        })
      ]
    };

    const allowanceInfo = getAllowanceInfoForStop(mockRailStop, token);
    expect(allowanceInfo.canEdit).toEqual(true);
  });

  it('nsbEditStops - train and railReplacementBus - one role for each - verify railStation', () => {

    let token = {
      roles: [
        JSON.stringify({
          "r": "editStops",
          "o": "OST",
          "z": "01",
          "e": {
            "EntityType": [
              "StopPlace"
            ],
            "StopPlaceType": [
              "railStation"
            ],
          }
        }),
        JSON.stringify({
          "r": "editStops",
          "o": "OST",
          "z": "01",
          "e": {
            "EntityType": [
              "StopPlace"
            ],
            "Submode": [
              "railReplacementBus",
            ],
          }
        })
      ]
    };

    const allowanceInfo = getAllowanceInfoForStop(mockRailStop, token);
    expect(allowanceInfo.canEdit).toEqual(true);
  });

  it('(Vestfold) Edit stops - blacklisted StopPlaceType and Submode', () => {

    let token = {
      roles: [
        JSON.stringify({
          "r": "editStops",
          "o": "OST",
          "z": "01",
          "e": {
            "EntityType": [
              "StopPlace"
            ],
            "StopPlaceType": [
              "!railStation",
              "!airport"
            ],
            "Submode": [
              "!railReplacementBus",
            ],
          }
        })
      ]
    };

    const allowanceRailStop = getAllowanceInfoForStop(mockRailStop, token);
    expect(allowanceRailStop.canEdit).toEqual(false);
    const allowanceRailReplacementBus = getAllowanceInfoForStop(mockRailReplacementStop, token);
    expect(allowanceRailReplacementBus.canEdit).toEqual(false);
  });


});
