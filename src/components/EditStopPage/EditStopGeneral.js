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

// React and Redux
import React from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { replace } from "redux-first-history";

// Material UI Icons
import MdBack from "@mui/icons-material/ArrowBack";
import MdLess from "@mui/icons-material/ExpandLess";
import MdSave from "@mui/icons-material/Save";
import MdUndo from "@mui/icons-material/Undo";

// Material UI Components
import FlatButton from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

// Actions
import { StopPlaceActions, UserActions } from "../../actions/";
import {
  deleteQuay,
  deleteStopPlace,
  getNeighbourStops,
  getStopPlaceAndPathLinkByVersion,
  getStopPlaceVersions,
  getStopPlaceWithAll,
  mergeAllQuaysFromStop,
  mergeQuays,
  moveQuaysToNewStop,
  moveQuaysToStop,
  saveParking,
  savePathLink,
  saveStopPlaceBasedOnType,
  terminateStop,
} from "../../actions/TiamatActions";
import * as types from "../../actions/Types";

// Components
import ConfirmDialog from "../Dialogs/ConfirmDialog";
import DeleteQuayDialog from "../Dialogs/DeleteQuayDialog";
import MergeQuaysDialog from "../Dialogs/MergeQuaysDialog";
import MergeStopDialog from "../Dialogs/MergeStopDialog";
import MoveQuayDialog from "../Dialogs/MoveQuayDialog";
import MoveQuayNewStopDialog from "../Dialogs/MoveQuayNewStopDialog";
import RequiredFieldsMissingDialog from "../Dialogs/RequiredFieldsMissingDialog";
import SaveDialog from "../Dialogs/SaveDialog";
import TerminateStopPlaceDialog from "../Dialogs/TerminateStopPlaceDialog";
import EditStopAdditional from "./EditStopAdditional";
import EditStopBoxTabs from "./EditStopBoxTabs";
import StopPlaceDetails from "./StopPlaceDetails";
import VersionsPopover from "./VersionsPopover";

// Utils
import mapToMutationVariables from "../../modelUtils/mapToQueryVariables";
import {
  shouldMutateParking,
  shouldMutatePathLinks,
} from "../../modelUtils/shouldMutate";
import Routes from "../../routes/";
import Settings from "../../singletons/SettingsManager";
import { getIsCurrentVersionMax } from "../../utils/";
import { getStopPermissions } from "../../utils/permissionsUtils";

class EditStopGeneral extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      confirmUndoOpen: false,
      confirmGoBack: false,
      saveDialogOpen: false,
      errorMessage: "",
      requiredFieldsMissingOpen: false,
      isLoading: false,
      tabValue: "1",
    };
  }

  handleSave() {
    const { stopPlace } = this.props;
    if (
      !stopPlace.name ||
      !stopPlace.name.trim().length ||
      !stopPlace.stopPlaceType
    ) {
      this.setState({
        requiredFieldsMissingOpen: true,
      });
    } else {
      this.setState({
        saveDialogOpen: true,
        errorMessage: "",
      });
    }
  }

  handleCloseMergeStopDialog() {
    this.props.dispatch(UserActions.hideMergeStopDialog());
  }

  handleCloseMergeQuaysDialog() {
    this.props.dispatch(UserActions.hideMergeQuaysDialog());
  }

  handleCloseDeleteQuay() {
    this.props.dispatch(UserActions.hideDeleteQuayDialog());
  }

  handleCloseDeleteStop() {
    this.props.dispatch(UserActions.hideDeleteStopDialog());
  }

  handleCloseMoveQuay() {
    this.props.dispatch(UserActions.closeMoveQuayDialog());
  }

  handleCloseMoveQuayNewStop() {
    this.props.dispatch(UserActions.closeMoveQuayToNewStopDialog());
  }

  async handleSaveSuccess(stopPlaceId) {
    const { dispatch, activeMap } = this.props;

    this.setState({
      saveDialogOpen: false,
    });

    await dispatch(replace(`/${Routes.STOP_PLACE}/${stopPlaceId}`));

    await dispatch(getStopPlaceVersions(stopPlaceId));
    await dispatch(
      getNeighbourStops(
        stopPlaceId,
        activeMap.getBounds(),
        new Settings().getShowExpiredStops(),
      ),
    );

    dispatch(UserActions.openSnackbar(types.SUCCESS));
  }

  handleSaveError(errorCode) {
    this.setState({
      errorMessage: errorCode,
    });
  }

  handleMergeQuaysFromStop(fromVersionComment, toVersionComment) {
    const { stopPlace, mergeSource, dispatch, activeMap } = this.props;
    this.setState({ isLoading: true });

    dispatch(
      mergeAllQuaysFromStop(
        mergeSource.id,
        stopPlace.id,
        fromVersionComment,
        toVersionComment,
      ),
    )
      .then(() => {
        dispatch(UserActions.openSnackbar(types.SUCCESS));
        this.handleCloseMergeStopDialog();
        dispatch(getStopPlaceWithAll(stopPlace.id)).then(() => {
          this.setState({ isLoading: false });
          if (activeMap) {
            let includeExpired = new Settings().getShowExpiredStops();
            dispatch(
              getNeighbourStops(
                stopPlace.id,
                activeMap.getBounds(),
                includeExpired,
              ),
            );
          }
        });
      })
      .catch(() => {
        this.setState({ isLoading: false });
      });
  }

  handleMergeQuays(versionComment) {
    const { mergingQuay, stopPlace, dispatch } = this.props;

    this.setState({ isLoading: true });

    dispatch(
      mergeQuays(
        stopPlace.id,
        mergingQuay.fromQuay.id,
        mergingQuay.toQuay.id,
        versionComment,
      ),
    )
      .then(() => {
        this.setState({ isLoading: false });
        dispatch(UserActions.openSnackbar(types.SUCCESS));
        this.handleCloseMergeQuaysDialog();
        dispatch(getStopPlaceWithAll(stopPlace.id));
      })
      .catch(() => {
        this.setState({ isLoading: false });
      });
  }

  handleDeleteQuay() {
    const { deletingQuay, dispatch, stopPlace } = this.props;
    this.setState({ isLoading: true });
    dispatch(deleteQuay(deletingQuay))
      .then(() => {
        this.setState({ isLoading: false });
        dispatch(UserActions.hideDeleteQuayDialog());
        dispatch(getStopPlaceWithAll(stopPlace.id)).then(() => {
          dispatch(UserActions.openSnackbar(types.SUCCESS));
        });
      })
      .catch(() => {
        this.setState({ isLoading: false });
      });
  }

  handleMoveQuay(fromVersionComment, toVersionComment) {
    const { movingQuay, dispatch, stopPlace } = this.props;
    this.setState({ isLoading: true });
    dispatch(
      moveQuaysToStop(
        stopPlace.id,
        movingQuay.id,
        fromVersionComment,
        toVersionComment,
      ),
    )
      .then(() => {
        this.setState({ isLoading: false });
        dispatch(UserActions.closeMoveQuayDialog());
        dispatch(UserActions.openSnackbar(types.SUCCESS));
        dispatch(getStopPlaceWithAll(stopPlace.id));
      })
      .catch(() => {
        this.setState({ isLoading: false });
      });
  }

  handleTerminateStop(
    shouldHardDelete,
    shouldTerminatePermanently,
    comment,
    dateTime,
  ) {
    const { stopPlace, dispatch } = this.props;
    this.setState({ isLoading: true });

    if (shouldHardDelete) {
      dispatch(deleteStopPlace(stopPlace.id))
        .then((response) => {
          this.setState({ isLoading: false });
          dispatch(UserActions.hideDeleteStopDialog());
          if (response.data.deleteStopPlace) {
            dispatch(UserActions.navigateToMainAfterDelete());
          }
        })
        .catch(() => {
          this.setState({ isLoading: false });
          dispatch(UserActions.hideDeleteStopDialog(true));
        });
    } else {
      dispatch(
        terminateStop(
          stopPlace.id,
          shouldTerminatePermanently,
          comment,
          dateTime,
        ),
      )
        .then((result) => {
          this.setState({ isLoading: false });
          this.handleSaveSuccess(stopPlace.id);
          this.handleCloseDeleteStop();
        })
        .catch((err) => {
          this.setState({ isLoading: false });
        });
    }
  }

  handleSaveAllEntities(userInput) {
    const { stopPlace, pathLink, originalPathLink, dispatch } = this.props;

    const shouldSaveParking = shouldMutateParking(stopPlace.parking);

    const pathLinkVariables =
      mapToMutationVariables.mapPathLinkToVariables(pathLink);

    const shouldSavePathLink = shouldMutatePathLinks(
      pathLinkVariables,
      pathLink,
      originalPathLink,
    );

    let id = null;

    dispatch(saveStopPlaceBasedOnType(stopPlace, userInput))
      .then((resultId) => {
        id = resultId;
        if (!shouldSaveParking && !shouldSavePathLink) {
          this.handleSaveSuccess(id);
        } else {
          const parkingVariables = mapToMutationVariables.mapParkingToVariables(
            stopPlace.parking,
            stopPlace.id || id,
          );

          if (shouldSavePathLink) {
            dispatch(savePathLink(pathLinkVariables))
              .then(() => {
                if (shouldSaveParking) {
                  dispatch(saveParking(parkingVariables))
                    .then((result) => {
                      this.handleSaveSuccess(id);
                    })
                    .catch((err) => {
                      this.handleSaveError(MutationErrorCodes.ERROR_PARKING);
                    });
                } else {
                  this.handleSaveSuccess(id);
                }
              })
              .catch((err) => {
                this.handleSaveError(MutationErrorCodes.ERROR_PATH_LINKS);
              });
          } else if (shouldSaveParking) {
            dispatch(saveParking(parkingVariables))
              .then((result) => {
                this.handleSaveSuccess(id);
              })
              .catch((err) => {
                this.handleSaveError(MutationErrorCodes.ERROR_PARKING);
              });
          }
        }
      })
      .catch((err) => {
        this.handleSaveError(MutationErrorCodes.ERROR_STOP_PLACE);
      });
  }

  handleGoBack() {
    this.setState({
      confirmGoBack: false,
    });
    this.props.dispatch(UserActions.navigateTo("/", ""));
  }

  handleAllowUserToGoBack() {
    if (this.props.stopHasBeenModified) {
      this.setState({
        confirmGoBack: true,
      });
    } else {
      this.handleGoBack();
    }
  }

  handleDiscardChanges() {
    this.setState({
      confirmUndoOpen: false,
    });
    this.props.dispatch(StopPlaceActions.discardChangesForEditingStop());
  }

  handleSlideChange(event, value) {
    this.setState({ tabValue: value });
    this.props.dispatch(UserActions.changeElementTypeTab(value));
  }

  showMoreStopPlace() {
    this.props.dispatch(UserActions.showEditStopAdditional());
  }

  showLessStopPlace = () => {
    this.props.dispatch(UserActions.hideEditStopAdditional());
  };

  handleDialogClose(dialog) {
    this.setState({
      [dialog]: false,
      allowPathLinkAdjustmentsDialog: false,
      saveDialogOpen: false,
    });
  }

  handleMoveQuaysNewStop(quayIds, fromVersionComment, toVersionComment) {
    const { dispatch, stopPlace } = this.props;
    let newStopPlaceId = null;

    this.setState({ isLoading: true });

    dispatch(moveQuaysToNewStop(quayIds, fromVersionComment, toVersionComment))
      .then((response) => {
        this.setState({ isLoading: false });
        if (
          response.data &&
          response.data.moveQuaysToStop &&
          response.data.moveQuaysToStop.id
        ) {
          newStopPlaceId = response.data.moveQuaysToStop.id;
        }
        dispatch(UserActions.closeMoveQuayToNewStopDialog());
        dispatch(UserActions.openSnackbar(types.SUCCESS));
        dispatch(getStopPlaceWithAll(stopPlace.id)).then((response) => {
          if (newStopPlaceId) {
            dispatch(
              UserActions.openSuccessfullyCreatedNewStop(newStopPlaceId),
            );
          }
        });
      })
      .catch(() => {
        this.setState({ isLoading: false });
      });
  }

  handleLoadVersion = ({ id, version }) => {
    const { dispatch } = this.props;
    dispatch(getStopPlaceAndPathLinkByVersion(id, version));
  };

  getTitleText = (stopPlace, originalStopPlace, formatMessage) => {
    const stopPlaceName = originalStopPlace
      ? originalStopPlace.name
      : stopPlace.name;
    return stopPlace && stopPlace.id
      ? `${stopPlaceName}, ${stopPlace.parentTopographicPlace} (${stopPlace.id})`
      : formatMessage({ id: "new_stop_title" });
  };

  getQuaysForMoveQuayToNewStop() {
    const { stopPlace, movingQuayToNewStop, neighbourStopQuays } = this.props;
    if (!movingQuayToNewStop || !stopPlace) return [];
    const { stopPlaceId } = movingQuayToNewStop;
    if (stopPlaceId === stopPlace.id) {
      return stopPlace.quays;
    } else {
      return neighbourStopQuays[stopPlaceId] || [];
    }
  }

  render() {
    const {
      stopPlace,
      stopHasBeenModified,
      activeElementTab,
      intl,
      showEditStopAdditional,
      versions,
      disabled,
      canDeleteStop,
      mergeStopDialogOpen,
      originalStopPlace,
      deleteQuayImportedId,
      fetchOTPInfoMergeLoading,
      mergeQuayWarning,
      fetchOTPInfoDeleteLoading,
      deleteQuayWarning,
    } = this.props;
    const { formatMessage } = intl;

    if (!stopPlace) return null;

    const translations = {
      name: formatMessage({ id: "name" }),
      publicCode: formatMessage({ id: "publicCode" }),
      description: formatMessage({ id: "description" }),
      unsaved: formatMessage({ id: "unsaved" }),
      none: formatMessage({ id: "none_no" }),
      quays: formatMessage({ id: "quays" }),
      quayItemName: stopPlace.stopPlaceType
        ? formatMessage({
            id: `stopTypes_${stopPlace.stopPlaceType}_quayItemName`,
          })
        : null,
      capacity: formatMessage({ id: "total_capacity" }),
      parking: formatMessage({ id: "parking_general" }),
      parkAndRide: formatMessage({ id: "parking_item_title_parkAndRide" }),
      bikeParking: formatMessage({ id: "parking_item_title_bikeParking" }),
      unknown: formatMessage({ id: "uknown_parking_type" }),
      elements: formatMessage({ id: "elements" }),
      versions: formatMessage({ id: "versions" }),
      validBetween: formatMessage({ id: "valid_between" }),
      notAssigned: formatMessage({ id: "not_assigned" }),
    };

    const stopPlaceLabel = this.getTitleText(
      stopPlace,
      originalStopPlace,
      formatMessage,
    );
    const isCurrentVersionMax = getIsCurrentVersionMax(
      versions,
      stopPlace.version,
      stopPlace.isChildOfParent,
    );

    const style = {
      border: "1px solid #511E12",
      background: "#fff",
      width: 405,
      marginTop: 1,
      position: "absolute",
      zIndex: 999,
      marginLeft: 2,
    };

    const scrollable = {
      overflowY: "auto",
      overflowX: "hidden",
      width: "100%",
      height: "82vh",
      position: "relative",
      display: "block",
      marginTop: 2,
    };

    const stopBoxBar = {
      color: "#fff",
      background: "rgb(39, 58, 70)",
      fontSize: 12,
      padding: 2,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    };

    const tabStyle = { color: "#000", fontSize: 10, fontWeight: 600 };
    const disableTerminate =
      stopPlace.isNewStop ||
      disabled ||
      (stopPlace.hasExpired && !isCurrentVersionMax);
    const quaysForMoveQuayToNewStop = this.getQuaysForMoveQuayToNewStop();

    return (
      <div style={style}>
        <div style={stopBoxBar}>
          <div style={{ display: "flex", alignItems: "center", color: "#fff" }}>
            <MdBack
              color="#fff"
              style={{
                cursor: "pointer",
                marginRight: 2,
                transform: "scale(0.8)",
              }}
              onClick={() => this.handleAllowUserToGoBack()}
            />
            <div>{stopPlaceLabel}</div>
          </div>
          <VersionsPopover
            versions={versions}
            buttonLabel={translations.versions}
            disabled={!versions.length}
            hide={stopPlace.isChildOfParent}
            handleSelect={this.handleLoadVersion.bind(this)}
            defaultValue={translations.notAssigned}
          />
        </div>
        <div id="scroll-body" style={scrollable}>
          <div style={{ padding: "5 5" }}>
            <StopPlaceDetails
              disabled={disabled}
              intl={intl}
              expanded={showEditStopAdditional}
              showLessStopPlace={this.showLessStopPlace.bind(this)}
              showMoreStopPlace={this.showMoreStopPlace.bind(this)}
            />
            {showEditStopAdditional ? (
              <EditStopAdditional disabled={disabled} />
            ) : null}
            <div style={{ textAlign: "center", marginBottom: 5 }}>
              {showEditStopAdditional ? (
                <FlatButton
                  icon={<MdLess />}
                  onClick={() => this.showLessStopPlace()}
                >
                  <MdLess />
                </FlatButton>
              ) : (
                <FlatButton
                  label={formatMessage({ id: "more" })}
                  labelStyle={{ fontSize: 12 }}
                  onClick={() => this.showMoreStopPlace()}
                >
                  {formatMessage({ id: "more" })}
                </FlatButton>
              )}
            </div>
            <Divider inset={true} />
            <Tabs
              onChange={this.handleSlideChange.bind(this)}
              value={activeElementTab}
              tabItemContainerStyle={{ backgroundColor: "#fff" }}
            >
              <Tab
                style={tabStyle}
                label={`${formatMessage({ id: "quays" })} (${
                  stopPlace.quays ? stopPlace.quays.length : 0
                })`}
                value={0}
              />
              <Tab
                style={tabStyle}
                label={`${formatMessage({ id: "parking_general" })} (${
                  stopPlace.parking.length
                })`}
                value={1}
              />
            </Tabs>
            <EditStopBoxTabs
              disabled={disabled}
              activeStopPlace={stopPlace}
              itemTranslation={translations}
              intl={intl}
              value={activeElementTab}
            />
          </div>
          <ConfirmDialog
            open={this.state.confirmUndoOpen}
            handleClose={() => {
              this.handleDialogClose("confirmUndoOpen");
            }}
            handleConfirm={() => {
              this.handleDiscardChanges();
            }}
            messagesById={{
              title: "discard_changes_title",
              body: "discard_changes_body",
              confirm: "discard_changes_confirm",
              cancel: "discard_changes_cancel",
            }}
            intl={intl}
          />
          <ConfirmDialog
            open={this.state.confirmGoBack}
            handleClose={() => {
              this.handleDialogClose("confirmGoBack");
            }}
            handleConfirm={() => {
              this.handleGoBack();
            }}
            messagesById={{
              title: "discard_changes_title",
              body: "discard_changes_body",
              confirm: "discard_changes_confirm",
              cancel: "discard_changes_cancel",
            }}
            intl={intl}
          />
          {this.state.saveDialogOpen && !disabled ? (
            <SaveDialog
              open={this.state.saveDialogOpen}
              handleClose={() => {
                this.handleDialogClose();
              }}
              handleConfirm={this.handleSaveAllEntities.bind(this)}
              errorMessage={this.state.errorMessage}
              intl={intl}
            />
          ) : null}
          <MergeStopDialog
            open={mergeStopDialogOpen}
            handleClose={this.handleCloseMergeStopDialog.bind(this)}
            handleConfirm={this.handleMergeQuaysFromStop.bind(this)}
            isFetchingQuays={this.props.isFetchingMergeInfo}
            isLoading={this.state.isLoading}
            intl={intl}
            hasStopBeenModified={stopHasBeenModified}
            sourceElement={this.props.mergeSource}
            targetElement={{
              id: stopPlace.id,
              name: stopPlace.name,
            }}
          />
          <MergeQuaysDialog
            open={this.props.mergingQuayDialogOpen}
            handleClose={this.handleCloseMergeQuaysDialog.bind(this)}
            handleConfirm={this.handleMergeQuays.bind(this)}
            intl={intl}
            mergingQuays={this.props.mergingQuay}
            hasStopBeenModified={stopHasBeenModified}
            isLoading={this.state.isLoading}
            OTPFetchIsLoading={fetchOTPInfoMergeLoading}
            mergeQuayWarning={mergeQuayWarning}
          />
          <DeleteQuayDialog
            open={this.props.deleteQuayDialogOpen}
            handleClose={this.handleCloseDeleteQuay.bind(this)}
            handleConfirm={this.handleDeleteQuay.bind(this)}
            intl={intl}
            deletingQuay={this.props.deletingQuay}
            isLoading={this.state.isLoading}
            importedId={deleteQuayImportedId}
            warningInfo={deleteQuayWarning}
            fetchingOTPInfoLoading={fetchOTPInfoDeleteLoading}
          />
          <TerminateStopPlaceDialog
            open={this.props.deleteStopDialogOpen}
            handleClose={this.handleCloseDeleteStop.bind(this)}
            handleConfirm={this.handleTerminateStop.bind(this)}
            intl={intl}
            previousValidBetween={stopPlace.validBetween}
            stopPlace={stopPlace}
            canDeleteStop={canDeleteStop}
            isLoading={this.state.isLoading}
            serverTimeDiff={this.props.serverTimeDiff}
            warningInfo={this.props.deleteStopDialogWarning}
          />
          <MoveQuayDialog
            open={this.props.moveQuayDialogOpen}
            handleClose={this.handleCloseMoveQuay.bind(this)}
            handleConfirm={this.handleMoveQuay.bind(this)}
            intl={intl}
            stopPlaceId={stopPlace.id}
            quay={this.props.movingQuay}
            hasStopBeenModified={stopHasBeenModified}
            isLoading={this.state.isLoading}
          />
          <MoveQuayNewStopDialog
            open={this.props.moveQuayToNewStopDialogOpen}
            handleClose={this.handleCloseMoveQuayNewStop.bind(this)}
            quays={quaysForMoveQuayToNewStop}
            handleConfirm={this.handleMoveQuaysNewStop.bind(this)}
            intl={intl}
            quay={this.props.movingQuayToNewStop}
            hasStopBeenModified={stopHasBeenModified}
            isLoading={this.state.isLoading}
          />
          <RequiredFieldsMissingDialog
            open={this.state.requiredFieldsMissingOpen}
            handleClose={() => {
              this.setState({ requiredFieldsMissingOpen: false });
            }}
            requiredMissing={{
              name: !stopPlace.name || !stopPlace.name.trim().length,
              type: !stopPlace.stopPlaceType,
            }}
            formatMessage={formatMessage}
            isNewStop={stopPlace.isNewStop}
          />
        </div>
        <div
          style={{
            border: "1px solid #efeeef",
            textAlign: "right",
            width: "100%",
            display: isCurrentVersionMax ? "flex" : "none",
            justifyContent: "space-around",
          }}
        >
          {!stopPlace.permanentlyTerminated &&
            !stopPlace.isChildOfParent &&
            isCurrentVersionMax && (
              <FlatButton
                disabled={disableTerminate}
                label={formatMessage({ id: "terminate_stop_place" })}
                style={{
                  margin: "8 5",
                  zIndex: 999,
                  fontSize: "0.7em",
                  color: disableTerminate ? "rgba(0, 0, 0, 0.3)" : "initial",
                }}
                labelStyle={{
                  fontSize: "0.7em",
                  color: disableTerminate ? "rgba(0, 0, 0, 0.3)" : "initial",
                }}
                onClick={() => {
                  this.props.dispatch(
                    UserActions.requestTerminateStopPlace(stopPlace.id),
                  );
                }}
              >
                {formatMessage({ id: "terminate_stop_place" })}
              </FlatButton>
            )}
          <FlatButton
            disabled={!stopHasBeenModified}
            label={formatMessage({ id: "undo_changes" })}
            style={{
              margin: "8 5",
              zIndex: 999,
              minWidth: "120px",
              fontSize: "0.7em",
              color: disabled || !stopHasBeenModified ? "#999" : "#000",
            }}
            labelStyle={{ fontSize: "0.7em" }}
            onClick={() => {
              this.setState({ confirmUndoOpen: true });
            }}
          >
            <MdUndo style={{ height: "1em", width: "1em" }} />
            {formatMessage({ id: "undo_changes" })}
          </FlatButton>
          <FlatButton
            disabled={disabled || !stopHasBeenModified}
            label={formatMessage({ id: "save_new_version" })}
            style={{
              margin: "8 5",
              zIndex: 999,
              fontSize: "0.7em",
              color: disabled || !stopHasBeenModified ? "#999" : "#000",
            }}
            onClick={this.handleSave.bind(this)}
          >
            <MdSave
              style={{
                height: "1em",
                width: "1em",
              }}
            />
            {formatMessage({ id: "save_new_version" })}
          </FlatButton>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  const stopPlace = state.stopPlace.current;
  const permissions = getStopPermissions(stopPlace);
  return {
    canDeleteStop: permissions.canDelete,
    stopPlace,
    mergeStopDialogOpen: state.stopPlace.mergeStopDialog
      ? state.stopPlace.mergeStopDialog.isOpen
      : false,
    mergeSource: state.stopPlace.mergeStopDialog,
    pathLink: state.stopPlace.pathLink,
    stopHasBeenModified: state.stopPlace.stopHasBeenModified,
    isMultiPolylinesEnabled: state.stopPlace.enablePolylines,
    activeElementTab: state.user.activeElementTab,
    showEditQuayAdditional: state.user.showEditQuayAdditional,
    showEditStopAdditional: state.user.showEditStopAdditional,
    mergingQuay: state.mapUtils.mergingQuay,
    mergingQuayDialogOpen: state.mapUtils.mergingQuayDialogOpen,
    deleteQuayDialogOpen: state.mapUtils.deleteQuayDialogOpen,
    deleteQuayImportedId: state.mapUtils.deleteQuayImportedId,
    deleteStopDialogOpen: state.mapUtils.deleteStopDialogOpen,
    deletingQuay: state.mapUtils.deletingQuay,
    versions: state.stopPlace.versions,
    originalPathLink: state.stopPlace.originalPathLink,
    moveQuayDialogOpen: state.mapUtils.moveQuayDialogOpen,
    moveQuayToNewStopDialogOpen: state.mapUtils.moveQuayToNewStopDialogOpen,
    movingQuay: state.mapUtils.movingQuay,
    movingQuayToNewStop: state.mapUtils.movingQuayToNewStop,
    activeMap: state.mapUtils.activeMap,
    canEditParentStop: permissions.canEditParentStop || false,
    originalStopPlace: state.stopPlace.originalCurrent,
    serverTimeDiff: state.user.serverTimeDiff,
    isFetchingMergeInfo: state.stopPlace.isFetchingMergeInfo,
    neighbourStopQuays: state.stopPlace.neighbourStopQuays,
    deleteStopDialogWarning: state.user.deleteStopDialogWarning,
    fetchOTPInfoMergeLoading: state.mapUtils.fetchOTPInfoMergeLoading,
    mergeQuayWarning: state.mapUtils.mergeQuayWarning,
    fetchOTPInfoDeleteLoading: state.mapUtils.fetchOTPInfoDeleteLoading,
    deleteQuayWarning: state.mapUtils.deleteQuayWarning,
  };
};

export default injectIntl(connect(mapStateToProps)(EditStopGeneral));
