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

import MenuItem from "@mui/material/MenuItem";
import React from "react";
import {
  getInverseSubmodesWhitelist,
  getStopTypesForSubmodes,
} from "../../modelUtils/modeUtils";
import ModalityIconSvg from "../MainPage/ModalityIconSvg";
import MoreMenuItem from "../MainPage/MoreMenuItem";

class ModalitiesMenuItems extends React.Component {
  render() {
    const {
      intl: { formatMessage },
      stopTypes,
      handleStopTypeChange,
      handleSubModeTypeChange,
      allowsInfo,
      stopPlaceTypeChosen,
      submodeChosen,
    } = this.props;

    const legalStopPlaceTypes = allowsInfo.legalStopPlaceTypes || [];
    const legalSubmodes = allowsInfo.legalSubmodes || [];
    const blacklistedStopTypes = allowsInfo.blacklistedStopPlaceTypes || [];
    const illegalSubmodes = getInverseSubmodesWhitelist(legalSubmodes);
    // stopPlacesTypes that submodes are depending on to be legal in order to render
    const adHocStopPlaceTypes = getStopTypesForSubmodes(legalSubmodes);
    const chosenStyle = { fontWeight: "bold" };
    const unchosenStyle = {};

    return (
      <div>
        {Object.keys(stopTypes).map((type, index) => {
          let isLegal =
            adHocStopPlaceTypes.indexOf(type) > -1 ||
            legalStopPlaceTypes.indexOf(type) > -1;

          if (blacklistedStopTypes.indexOf(type) > -1) {
            isLegal = false;
          }

          const stopTypeMatchingChosen = stopPlaceTypeChosen === type;
          const transportMode = stopTypes[type].transportMode;
          let submodes = stopTypes[type].submodes;

          if (submodes) {
            // Add "unspeficied" submode option, corresponding to null value,
            // and sort according to the localized formatted version, with
            // unspecified always on top
            submodes = [null]
              .concat(submodes)
              .map((submode) => {
                return {
                  submode,
                  formatted: formatMessage({
                    id: `stopTypes_${type}_submodes_${
                      submode || "unspecified"
                    }`,
                  }),
                };
              })
              .sort((a, b) => {
                if (a.submode === null) return -1;
                if (b.submode === null) return 1;
                if (a.formatted < b.formatted) return -1;
                if (a.formatted > b.formatted) return 1;
                return 0;
              });
          }

          return (
            <MoreMenuItem
              leftIcon={
                <ModalityIconSvg iconStyle={{ float: "left" }} type={type} />
              }
              label={
                <span
                  style={stopTypeMatchingChosen ? chosenStyle : unchosenStyle}
                >
                  {formatMessage({ id: `stopTypes_${type}_name` })}
                </span>
              }
              key={"stopType" + index}
              className={isLegal ? "" : "menu-item--not-legal"}
              value={type}
              style={{ padding: "0px 10px" }}
              onClick={() => {
                !submodes && handleStopTypeChange(type);
              }}
              openLeft={false}
            >
              {submodes &&
                submodes.map(({ submode, formatted }) => {
                  // make all submodes legal if stopPlace is legal
                  let isLegal =
                    illegalSubmodes.indexOf(submode) !== -1 &&
                    adHocStopPlaceTypes.indexOf(type) === -1;

                  const isLegalStopPlaceType =
                    legalStopPlaceTypes.indexOf(type) > -1;
                  // if stopPlace is allowed, not specific item should be legal
                  if (submode == null && isLegalStopPlaceType) {
                    isLegal = true;
                  }

                  // if submode is whitelisted
                  if (legalSubmodes.indexOf(submode) > -1) {
                    isLegal = true;
                  }

                  const isMatchingChosen =
                    stopTypeMatchingChosen && submode === submodeChosen;

                  return (
                    <MenuItem
                      key={"stopType-sub" + submode + "-" + index}
                      value={submode}
                      className={isLegal ? "" : "menu-item--not-legal"}
                      style={{ padding: "0px 10px" }}
                      onClick={() => {
                        handleSubModeTypeChange(type, transportMode, submode);
                      }}
                    >
                      <ModalityIconSvg
                        iconStyle={{ float: "left" }}
                        type={type}
                        submode={submode}
                      />
                      <span
                        style={
                          stopTypeMatchingChosen && submodeChosen === submode
                            ? chosenStyle
                            : unchosenStyle
                        }
                      >
                        {submode &&
                          formatMessage({
                            id: `stopTypes_${type}_submodes_${submode}`,
                          })}
                        {!submode &&
                          formatMessage({
                            id: `stopTypes_${type}_submodes_unspecified`,
                          })}
                      </span>
                    </MenuItem>
                  );
                })}
            </MoreMenuItem>
          );
        })}
      </div>
    );
  }
}

export default ModalitiesMenuItems;
