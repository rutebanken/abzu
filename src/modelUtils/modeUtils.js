import stopTypes from "../models/stopTypes";
import { submodes } from "../models/submodes";

export const getInverseSubmodesWhitelist = (whitelist) => {
  return submodes.filter((submode) => whitelist.indexOf(submode) === -1);
};

export const getStopTypesForSubmodes = (legalSubmodes) => {
  let result = [];

  if (!legalSubmodes?.length) return result;

  for (let key of Object.keys(stopTypes)) {
    const stopType = stopTypes[key];
    const submodes = stopType.submodes || [];
    legalSubmodes.forEach((legalSubmode) => {
      if (submodes.indexOf(legalSubmode) > -1) {
        if (result.indexOf(key) === -1 && legalSubmode !== null) {
          result.push(key);
        }
      }
    });
  }
  return result;
};
