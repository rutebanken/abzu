import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getContext } from "../actions/TiamatActions";
import { getTiamatClient } from "../graphql/clients";
import {
  findFareZones,
  findFareZonesForFilter,
  findTariffZonesByIds,
  findTariffZonesForFilter,
} from "../graphql/Tiamat/queries";
import { FareZone } from "../models/FareZone";
import { TariffZone } from "../models/TariffZone";
import SettingsManager from "../singletons/SettingsManager";
import { RootState } from "../store/store";

const Settings = new SettingsManager();

const mergeTariffZones = (prev: TariffZone[], next: TariffZone[]) => {
  const map = new Map();
  prev.forEach((item) => map.set(item.id, item));
  next
    .map(({ polygon, ...rest }) => ({
      ...rest,
      polygon: {
        ...polygon,
        legacyCoordinates: polygon.legacyCoordinates.map((lnglat: number[]) =>
          lnglat.slice().reverse(),
        ),
      },
    }))
    .forEach((item) => map.set(item.id, { ...map.get(item.id), ...item }));
  return Array.from(map.values());
};

const sortByPrivateCode = (a: FareZone, b: FareZone) => {
  if (a.privateCode.value > b.privateCode.value) {
    return 1;
  } else if (b.privateCode.value > a.privateCode.value) {
    return -1;
  } else {
    return 0;
  }
};

export interface ZonesState {
  showFareZones: boolean;
  showTariffZones: boolean;
  fareZonesForFilter: FareZone[];
  tariffZonesForFilter: TariffZone[];
  fareZones: FareZone[];
  tariffZones: TariffZone[];
  selectedFareZones: string[];
  selectedTariffZones: string[];
}

const initialState: ZonesState = {
  showFareZones: Settings.getShowFareZonesInMap(),
  showTariffZones: Settings.getShowTariffZonesInMap(),
  fareZonesForFilter: [],
  tariffZonesForFilter: [],
  fareZones: [],
  tariffZones: [],
  selectedFareZones: [],
  selectedTariffZones: [],
};

export const getTariffZonesForFilterAction = createAsyncThunk<
  TariffZone[],
  void,
  { state: RootState }
>("zones/getTariffZonesForFilter", async (_, thunkAPI) => {
  const response = await getTiamatClient().query({
    query: findTariffZonesForFilter,
    fetchPolicy: "network-only",
    context: getContext(thunkAPI.getState().user.auth),
  });

  return response.data.tariffZones;
});

export const getFareZonesForFilterAction = createAsyncThunk<
  FareZone[],
  void,
  { state: RootState }
>("zones/getFareZonesForFilter", async (_, thunkAPI) => {
  const response = await getTiamatClient().query({
    query: findFareZonesForFilter,
    fetchPolicy: "network-only",
    context: getContext(thunkAPI.getState().user.auth),
  });

  return response.data.fareZones;
});

export const getTariffZonesByIdsAction = createAsyncThunk<
  TariffZone[],
  string[],
  { state: RootState }
>("zones/getTariffZonesByIds", async (ids, thunkAPI) => {
  const response = await getTiamatClient().query({
    query: findTariffZonesByIds,
    variables: { ids },
    fetchPolicy: "network-only",
    context: getContext(thunkAPI.getState().user.auth),
  });
  return response.data.tariffZones;
});

export const getFareZonesByIdsAction = createAsyncThunk<
  FareZone[],
  string[],
  { state: RootState }
>("zones/getFareZonesByIds", async (ids, thunkAPI) => {
  const response = await getTiamatClient().query({
    query: findFareZones,
    variables: { ids },
    fetchPolicy: "network-only",
    context: getContext(thunkAPI.getState().user.auth),
  });

  return response.data.fareZones;
});

export const zonesSlice = createSlice({
  name: "zones",
  initialState,
  reducers: {
    toggleShowFareZonesInMap: (state, action: PayloadAction<boolean>) => {
      state.showTariffZones = false;
      state.showFareZones = action.payload;
    },
    toggleShowTariffZonesInMap: (state, action: PayloadAction<boolean>) => {
      state.showFareZones = false;
      state.showTariffZones = action.payload;
    },
    setSelectedFareZones: (state, action: PayloadAction<string[]>) => {
      state.selectedFareZones = action.payload;
    },
    setSelectedTariffZones: (state, action: PayloadAction<string[]>) => {
      state.selectedTariffZones = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(
      getTariffZonesForFilterAction.fulfilled,
      (state, { payload }) => {
        state.tariffZonesForFilter = payload.slice();
      },
    );
    builder.addCase(
      getFareZonesForFilterAction.fulfilled,
      (state, { payload }) => {
        state.fareZonesForFilter = payload.slice().sort(sortByPrivateCode);
      },
    );
    builder.addCase(
      getTariffZonesByIdsAction.fulfilled,
      (state, { payload }) => {
        state.tariffZones = mergeTariffZones(state.tariffZones, payload);
      },
    );
    builder.addCase(getFareZonesByIdsAction.fulfilled, (state, { payload }) => {
      state.fareZones = mergeTariffZones(state.fareZones, payload);
    });
  },
});

export const { setSelectedFareZones, setSelectedTariffZones } =
  zonesSlice.actions;

export const toggleShowFareZonesInMap = createAsyncThunk<void, boolean>(
  "zones/toggleShowFareZonesInMap",
  async (value, { dispatch }) => {
    Settings.setShowTariffZonesInMap(false);
    Settings.setShowFareZonesInMap(value);
    dispatch(zonesSlice.actions.toggleShowFareZonesInMap(value));
  },
);

export const toggleShowTariffZonesInMap = createAsyncThunk<void, boolean>(
  "zones/toggleShowTariffZonesInMap",
  async (value, { dispatch }) => {
    Settings.setShowFareZonesInMap(false);
    Settings.setShowTariffZonesInMap(value);
    dispatch(zonesSlice.actions.toggleShowTariffZonesInMap(value));
  },
);

export default zonesSlice.reducer;
