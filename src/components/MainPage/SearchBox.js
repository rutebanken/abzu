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

import MdMore from "@mui/icons-material/ExpandMore";
import MdLocationSearching from "@mui/icons-material/LocationSearching";
import SearchIcon from "@mui/icons-material/Search";
import { Box, Button, FormControlLabel, FormGroup } from "@mui/material";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import debounce from "lodash.debounce";
import React from "react";
import ReactDOM from "react-dom";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { StopPlaceActions, UserActions } from "../../actions/";
import {
  findEntitiesWithFilters,
  findTopographicalPlace,
} from "../../actions/TiamatActions";
import { getPrimaryDarkerColor } from "../../config/themeConfig";
import { Entities } from "../../models/Entities";
import Routes from "../../routes/";
import FavoriteManager from "../../singletons/FavoriteManager";
import MdSpinner from "../../static/icons/spinner";
import { getStopPermissions } from "../../utils/permissionsUtils";
import CoordinatesDialog from "../Dialogs/CoordinatesDialog";
import FavoriteNameDialog from "../Dialogs/FavoriteNameDialog";
import ModalityFilter from "../EditStopPage/ModalityFilter";
import NewStopPlace from "./CreateNewStop";
import FavoritePopover from "./FavoritePopover";
import SearchBoxDetails from "./SearchBoxDetails";
import { createSearchMenuItem } from "./SearchMenuItem";
import TopographicalFilter from "./TopographicalFilter";

class SearchBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showMoreFilterOptions: false,
      createNewStopOpen: false,
      coordinatesDialogOpen: false,
      loading: false,
      stopPlaceSearchValue: "",
      topographicPlaceFilterValue: "",
    };

    const searchStop = (searchText, dataSource, params, filter) => {
      const chips = filter ? filter.topoiChips : this.props.topoiChips;
      const showFutureAndExpired = filter
        ? filter.showFutureAndExpired
        : this.props.showFutureAndExpired;
      const stopPlaceTypes = filter
        ? filter.stopType
        : this.props.stopTypeFilter;
      this.setState({ loading: true });

      this.props
        .dispatch(
          findEntitiesWithFilters(
            searchText,
            stopPlaceTypes,
            chips,
            showFutureAndExpired,
          ),
        )
        .then(() => {
          this.setState({ loading: false });
        });
    };
    this.debouncedSearch = debounce(searchStop, 500);
  }

  handleSearchUpdate = (event, searchText, reason) => {
    // prevents ghost clicks
    if (event && event.source === "click") {
      return;
    }
    if (reason && reason === "clear") {
      this.setState({ stopPlaceSearchValue: "" });
      this.props.dispatch(UserActions.clearSearchResults());
      this.props.dispatch(UserActions.setSearchText(""));
    }

    if (!searchText || !searchText.length) {
      this.props.dispatch(UserActions.clearSearchResults());
      this.props.dispatch(UserActions.setSearchText(""));
      this.setState({ stopPlaceSearchValue: "" });
    } else if (searchText.indexOf("(") > -1 && searchText.indexOf(")") > -1) {
    } else {
      this.props.dispatch(UserActions.setSearchText(searchText));
      this.debouncedSearch(
        searchText,
        this.props.dataSource,
        this.props.params,
        this.props.filter,
      );
    }
  };

  handleEdit(id, entityType) {
    const route =
      entityType === Entities.STOP_PLACE
        ? Routes.STOP_PLACE
        : Routes.GROUP_OF_STOP_PLACE;
    this.props.dispatch(UserActions.navigateTo(`/${route}/`, id));
  }

  handleSaveAsFavorite() {
    this.props.dispatch(UserActions.openFavoriteNameDialog());
  }

  removeFiltersAndSearch() {
    this.props.dispatch(UserActions.removeAllFilters());
    this.handleSearchUpdate(null, this.props.searchText);
  }

  handleRetrieveFilter(filter) {
    this.props.dispatch(UserActions.loadFavoriteSearch(filter));
    this.handleSearchUpdate(null, filter.searchText, null, null, filter);

    this.refs.searchText.setState({
      open: true,
      anchorEl: ReactDOM.findDOMNode(this.refs.searchText),
    });
  }

  handlePopoverDismiss(filters) {
    this.props.dispatch(UserActions.applyStopTypeSearchFilter(filters));
  }

  toggleShowFutureAndExpired(value) {
    const { searchText, topoiChips, stopTypeFilter } = this.props;
    if (searchText) {
      this.handleSearchUpdate(searchText, null, null, {
        showFutureAndExpired: value,
        topoiChips,
        stopType: stopTypeFilter,
      });
    }
    this.props.dispatch(UserActions.toggleShowFutureAndExpired(value));
  }

  handleTopographicalPlaceInput(event, searchText, reason) {
    if (reason && reason === "clear") {
      this.setState({ topographicPlaceFilterValue: "" });
    }
    const { dispatch } = this.props;
    dispatch(findTopographicalPlace(searchText));
  }

  handleNewRequest(event, result, reason) {
    if (
      result &&
      typeof result.element !== "undefined" &&
      result.element !== null
    ) {
      this.props.dispatch(StopPlaceActions.setMarkerOnMap(result.element));
      this.setState({ stopPlaceSearchValue: "" });
    }
  }

  handleOpenCoordinatesDialog() {
    this.setState({
      coordinatesDialogOpen: true,
    });
  }

  handleOpenLookupCoordinatesDialog() {
    this.props.dispatch(UserActions.openLookupCoordinatesDialog());
  }

  handleCloseLookupCoordinatesDialog() {
    this.props.dispatch(UserActions.closeLookupCoordinatesDialog());
  }

  handleApplyModalityFilters(filters) {
    const { searchText, showFutureAndExpired, topoiChips } = this.props;
    if (searchText) {
      this.handleSearchUpdate(searchText, null, null, {
        showFutureAndExpired,
        topoiChips,
        stopType: filters,
      });
    }
    this.props.dispatch(UserActions.applyStopTypeSearchFilter(filters));
  }

  handleSubmitCoordinates(position) {
    this.props.dispatch(StopPlaceActions.changeMapCenter(position, 11));
    this.props.dispatch(
      UserActions.setMissingCoordinates(position, this.props.chosenResult.id),
    );

    this.setState({
      coordinatesDialogOpen: false,
    });
  }

  handleAddChip(event, value) {
    if (value == null) {
      //
    } else {
      const { text, type, id } = value;
      const { searchText, stopTypeFilters, showFutureAndExpired, topoiChips } =
        this.props;

      if (searchText) {
        this.handleSearchUpdate(null, searchText, null, {
          showFutureAndExpired,
          topoiChips: topoiChips.concat({
            text,
            type,
            value: id,
          }),
          stopType: stopTypeFilters,
        });
      }
      this.props.dispatch(
        UserActions.addToposChip({ text: text, type: type, value: id }),
      );

      this.setState({ topographicPlaceFilterValue: "" });
    }
  }

  handleDeleteChip(chipValue) {
    const {
      dispatch,
      searchText,
      stopTypeFilters,
      showFutureAndExpired,
      topoiChips,
    } = this.props;
    if (searchText) {
      this.handleSearchUpdate(null, searchText, {
        showFutureAndExpired,
        topoiChips: topoiChips.filter((chip) => chip.value !== chipValue),
        stopType: stopTypeFilters,
      });
    }
    dispatch(UserActions.deleteChip(chipValue));
  }

  handleNewStop(isMultiModal) {
    this.props.dispatch(UserActions.toggleIsCreatingNewStop(isMultiModal));
  }

  handleLookupCoordinates(position) {
    this.props.dispatch(UserActions.lookupCoordinates(position, false));
    this.handleCloseLookupCoordinatesDialog();
  }

  handleClearSearch() {
    this.props.dispatch(UserActions.setSearchText(""));
  }

  handleToggleFilter(value) {
    this.setState({
      showMoreFilterOptions: value,
    });
  }

  getTopographicalNames(topographicalPlace) {
    let name = topographicalPlace.name.value;

    if (
      topographicalPlace.topographicPlaceType === "municipality" &&
      topographicalPlace.parentTopographicPlace
    ) {
      name += `, ${topographicalPlace.parentTopographicPlace.name.value}`;
    }
    return name;
  }

  getMenuItems(nextProps) {
    const { dataSource, topoiChips, stopTypeFilter, searchText } = nextProps;
    const { formatMessage } = nextProps.intl;
    let menuItems = [];
    if (dataSource && dataSource.length) {
      menuItems = dataSource.map((element) =>
        createSearchMenuItem(element, formatMessage),
      );
    } else {
      menuItems = [
        {
          element: null,
          text: searchText,
          id: null,
          menuDiv: (
            <MenuItem disabled={true}>
              {formatMessage({ id: "no_results_found" })}
            </MenuItem>
          ),
        },
      ];
    }
    if (stopTypeFilter.length || topoiChips.length) {
      const filterNotification = {
        text: searchText,
        menuDiv: (
          <MenuItem onClick={() => this.removeFiltersAndSearch()}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                minWidth: 340,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontWeight: 600, fontSize: "0.9em" }}>
                  {formatMessage({ id: "filters_are_applied" })}
                </div>
                <div
                  style={{
                    fontSize: "0.8em",
                    color: getPrimaryDarkerColor(),
                    cursor: "pointer",
                  }}
                >
                  {formatMessage({ id: "remove" })}
                </div>
              </div>
            </div>
          </MenuItem>
        ),
      };

      if (menuItems.length > 6) {
        menuItems[6] = filterNotification;
      } else {
        menuItems.push(filterNotification);
      }
    }
    return menuItems;
  }

  render() {
    const {
      chosenResult,
      isCreatingNewStop,
      favorited,
      missingCoordinatesMap,
      intl,
      stopTypeFilter,
      topoiChips,
      topographicalPlaces,
      canEdit,
      lookupCoordinatesOpen,
      newStopIsMultiModal,
      dataSource,
      showFutureAndExpired,
      isGuest,
    } = this.props;
    const { coordinatesDialogOpen, showMoreFilterOptions, loading } =
      this.state;

    const { formatMessage, locale } = intl;
    const menuItems = this.getMenuItems(this.props);
    const Loading = loading &&
      !dataSource.length && [
        {
          text: "",
          menuDiv: (
            <MenuItem>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "0.8em",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <MdSpinner />
                <div style={{ marginLeft: 5 }}>
                  {formatMessage({ id: "loading" })}
                </div>
              </div>
            </MenuItem>
          ),
        },
      ];

    const topographicalPlacesDataSource = topographicalPlaces
      .filter(
        (place) =>
          place.topographicPlaceType === "county" ||
          place.topographicPlaceType === "municipality" ||
          place.topographicPlaceType === "country",
      )
      .filter(
        (place) =>
          topoiChips.map((chip) => chip.value).indexOf(place.id) === -1,
      )
      .map((place) => {
        const name = this.getTopographicalNames(place);
        return {
          text: name,
          id: place.id,
          value: (
            <div
              style={{
                marginLeft: 10,
                display: "flex",
                flexDirection: "column",
                minWidth: 380,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontSize: "0.9em" }}>{name}</div>
                <div style={{ fontSize: "0.6em", color: "grey" }}>
                  {formatMessage({ id: place.topographicPlaceType })}
                </div>
              </div>
            </div>
          ),
          type: place.topographicPlaceType,
        };
      });

    const newStopText = {
      headerText: formatMessage({
        id: newStopIsMultiModal
          ? "making_parent_stop_place_title"
          : "making_stop_place_title",
      }),
      bodyText: formatMessage({ id: "making_stop_place_hint" }),
    };

    let favoriteText = {
      title: formatMessage({ id: "favorites_title" }),
      noFavoritesFoundText: formatMessage({ id: "no_favorites_found" }),
    };

    const text = {
      emptyDescription: formatMessage({ id: "empty_description" }),
      edit: formatMessage({ id: "edit" }),
      view: formatMessage({ id: "view" }),
    };

    const formControlLabelStyle = {
      "& .MuiFormControlLabel-label": {
        fontSize: "0.8em",
      },
    };

    const searchBoxWrapperStyle = {
      top: 60,
      background: "#fff",
      height: "auto",
      width: 460,
      margin: 8,
      position: "absolute",
      zIndex: 999,
      padding: 8,
      border: "1px solid rgb(81, 30, 18)",
    };

    const filterOptions = createFilterOptions({
      matchFrom: "any",
      stringify: (option) => option.text,
    });

    return (
      <div>
        <CoordinatesDialog
          open={lookupCoordinatesOpen}
          handleClose={this.handleCloseLookupCoordinatesDialog.bind(this)}
          handleConfirm={this.handleLookupCoordinates.bind(this)}
          titleId={"lookup_coordinates"}
          intl={intl}
        />
        <CoordinatesDialog
          open={coordinatesDialogOpen}
          handleClose={() => this.setState({ coordinatesDialogOpen: false })}
          handleConfirm={this.handleSubmitCoordinates.bind(this)}
          intl={intl}
        />
        <FavoriteNameDialog />
        <div style={searchBoxWrapperStyle}>
          <div key="search-name-wrapper">
            <FavoritePopover
              caption={formatMessage({ id: "favorites" })}
              items={[]}
              filter={stopTypeFilter}
              onItemClick={this.handleRetrieveFilter.bind(this)}
              onDismiss={this.handlePopoverDismiss.bind(this)}
              text={favoriteText}
            />
            <div
              style={{
                width: "100%",
                margin: "auto",
                border: "1px solid hsla(182, 53%, 51%, 0.1)",
              }}
            >
              <ModalityFilter
                locale={locale}
                stopTypeFilter={stopTypeFilter}
                handleApplyFilters={this.handleApplyModalityFilters.bind(this)}
              />
              {showMoreFilterOptions ? (
                <div>
                  <div style={{ width: "100%", textAlign: "center" }}>
                    <Button
                      onClick={() => this.handleToggleFilter(false)}
                      style={{
                        fontSize: 12,
                        paddingBottom: "12px",
                        color: "black",
                      }}
                    >
                      {formatMessage({ id: "filters_less" })}
                    </Button>
                  </div>
                  <div style={{ alignItems: "center" }}>
                    <Autocomplete
                      freeSolo
                      getOptionLabel={(option) => `${option.text}`}
                      options={topographicalPlacesDataSource}
                      onInputChange={this.handleTopographicalPlaceInput.bind(
                        this,
                      )}
                      inputValue={this.state.topographicPlaceFilterValue}
                      onChange={this.handleAddChip.bind(this)}
                      noOptionsText={formatMessage({ id: "no_results_found" })}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          variant="standard"
                          label={formatMessage({ id: "filter_by_topography" })}
                          onChange={(event) => {
                            // don't fire API if the user delete or not entered anything
                            if (event.target.value !== null) {
                              this.setState({
                                topographicPlaceFilterValue: event.target.value,
                              });
                            }
                          }}
                        />
                      )}
                      renderOption={(props, option, { selected }) => (
                        <MenuItem {...props} key={option.id}>
                          {option.value}
                        </MenuItem>
                      )}
                    />
                    <div>
                      <FormGroup>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={showFutureAndExpired}
                              onChange={(e, value) =>
                                this.toggleShowFutureAndExpired(value)
                              }
                            />
                          }
                          label={formatMessage({
                            id: "show_future_expired_and_terminated",
                          })}
                          sx={formControlLabelStyle}
                        />
                      </FormGroup>
                    </div>
                  </div>
                  <TopographicalFilter
                    topoiChips={topoiChips}
                    handleDeleteChip={this.handleDeleteChip.bind(this)}
                  />
                </div>
              ) : (
                <div style={{ width: "100%", textAlign: "center" }}>
                  <Button
                    style={{ fontSize: 12 }}
                    onClick={() => this.handleToggleFilter(true)}
                    color={"textColor"}
                  >
                    {formatMessage({ id: "filters_more" })}
                  </Button>
                </div>
              )}
            </div>

            <Autocomplete
              //animated={false}
              //openOnFocus
              filterOptions={(options) => options}
              freeSolo
              options={menuItems}
              loading={loading}
              loadingText={
                <MenuItem>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "0.8em",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <MdSpinner />
                    <div style={{ marginLeft: 5 }}>
                      {formatMessage({ id: "loading" })}
                    </div>
                  </div>
                </MenuItem>
              }
              onInputChange={this.handleSearchUpdate.bind(this)}
              inputValue={this.state.stopPlaceSearchValue}
              renderOption={(props, option, { selected }) => (
                <MenuItem {...props} key={option.id}>
                  {option.menuDiv}
                </MenuItem>
              )}
              onChange={this.handleNewRequest.bind(this)}
              getOptionLabel={(option) => option.text || ""}
              noOptionsText={formatMessage({ id: "no_results_found" })}
              renderInput={(params) => (
                <Box sx={{ display: "flex", alignItems: "flex-end" }}>
                  <SearchIcon sx={{ color: "action.active", mr: 1, my: 0.5 }} />
                  <TextField
                    {...params}
                    label={formatMessage({ id: "filter_by_name" })}
                    variant="standard"
                    onChange={(event) => {
                      // don't fire API if the user delete or not entered anything
                      if (event.target.value !== null) {
                        this.setState({
                          stopPlaceSearchValue: event.target.value,
                        });
                      }
                    }}
                  />
                </Box>
              )}
            />
          </div>
          <div style={{ marginBottom: 5, textAlign: "right", marginRight: 10 }}>
            <Button
              style={{ marginLeft: 10, fontSize: 12 }}
              disabled={!!favorited}
              onClick={() => {
                this.handleSaveAsFavorite(!!favorited);
              }}
              color={"textColor"}
            >
              {formatMessage({ id: "filter_save_favorite" })}
            </Button>
          </div>
          <div key="searchbox-edit">
            {chosenResult ? (
              <SearchBoxDetails
                handleEdit={this.handleEdit.bind(this)}
                result={chosenResult}
                handleChangeCoordinates={this.handleOpenCoordinatesDialog.bind(
                  this,
                )}
                userSuppliedCoordinates={
                  missingCoordinatesMap &&
                  missingCoordinatesMap[chosenResult.id]
                }
                text={text}
                canEdit={canEdit}
                formatMessage={formatMessage}
              />
            ) : null}
            {!isGuest && (
              <div style={{ marginTop: 10 }}>
                {isCreatingNewStop ? (
                  <NewStopPlace
                    text={newStopText}
                    onClose={() => this.setState({ createNewStopOpen: false })}
                  />
                ) : (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <Button
                      onClick={this.handleOpenLookupCoordinatesDialog.bind(
                        this,
                      )}
                      variant="outlined"
                      startIcon={
                        <MdLocationSearching
                          style={{ width: 20, height: 20 }}
                        />
                      }
                      sx={{ color: "black" }}
                    >
                      {formatMessage({ id: "lookup_coordinates" })}
                    </Button>
                    <Button
                      variant="contained"
                      onClick={(e) => {
                        this.setState({
                          createNewStopOpen: true,
                          anchorEl: e.currentTarget,
                        });
                      }}
                      color={"primary2Color"}
                      sx={{ color: "white" }}
                      startIcon={<MdMore style={{ width: 20, height: 20 }} />}
                    >
                      {formatMessage({ id: "new_stop" })}
                    </Button>

                    <Menu
                      open={this.state.createNewStopOpen}
                      anchorEl={this.state.anchorEl}
                      anchorOrigin={{
                        horizontal: "left",
                        vertical: "bottom",
                      }}
                      targetOrigin={{ horizontal: "left", vertical: "top" }}
                      onClose={() => {
                        this.setState({ createNewStopOpen: false });
                      }}
                    >
                      <MenuItem onClick={() => this.handleNewStop(false)}>
                        {formatMessage({ id: "new_stop" })}
                      </MenuItem>
                      <MenuItem onClick={() => this.handleNewStop(true)}>
                        {formatMessage({
                          id: "new__multi_stop",
                        })}
                      </MenuItem>
                    </Menu>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  const favoriteManager = new FavoriteManager();
  const { stopType, topoiChips, text } = state.user.searchFilters;
  const favoriteContent = favoriteManager.createSavableContent(
    "",
    text,
    stopType,
    topoiChips,
  );
  const favorited = favoriteManager.isFavoriteAlreadyStored(favoriteContent);

  return {
    chosenResult: state.stopPlace.activeSearchResult,
    dataSource: state.stopPlace.searchResults || [],
    isCreatingNewStop: state.user.isCreatingNewStop,
    stopTypeFilter: state.user.searchFilters.stopType,
    topoiChips: state.user.searchFilters.topoiChips,
    favorited,
    missingCoordinatesMap: state.user.missingCoordsMap,
    searchText: state.user.searchFilters.text,
    topographicalPlaces: state.stopPlace.topographicalPlaces || [],
    canEdit: getStopPermissions(state.stopPlace.current).canEdit,
    lookupCoordinatesOpen: state.user.lookupCoordinatesOpen,
    newStopIsMultiModal: state.user.newStopIsMultiModal,
    showFutureAndExpired: state.user.searchFilters.showFutureAndExpired,
    isGuest: state.user.isGuest,
  };
};

export default injectIntl(connect(mapStateToProps)(SearchBox));
