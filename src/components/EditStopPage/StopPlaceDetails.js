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

import MdLanguage from "@mui/icons-material/Language";
import MdTransfer from "@mui/icons-material/TransferWithinAStation";
import MdKey from "@mui/icons-material/VpnKey";
import MdWarning from "@mui/icons-material/Warning";
import MdWC from "@mui/icons-material/Wc";
import FlatButton from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import TextField from "@mui/material/TextField";
import debounce from "lodash.debounce";
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import {
  AssessmentActions,
  EquipmentActions,
  StopPlaceActions,
  UserActions,
} from "../../actions/";
import {
  addTag,
  findTagByName,
  getTags,
  removeTag,
} from "../../actions/TiamatActions";
import { getPrimaryDarkerColor } from "../../config/themeConfig";
import stopTypes from "../../models/stopTypes";
import weightTypes, { weightColors } from "../../models/weightTypes";
import equipmentHelpers from "../../modelUtils/equipmentHelpers";
import Routes from "../../routes";
import BusShelter from "../../static/icons/facilities/BusShelter";
import TicketMachine from "../../static/icons/facilities/TicketMachine";
import WaitingRoom from "../../static/icons/facilities/WaitingRoom";
import TransportSign from "../../static/icons/TransportSign";
import { getIn } from "../../utils";
import {
  getAllowanceInfoFromLocationPermissions,
  getStopPermissions,
} from "../../utils/permissionsUtils";
import AltNamesDialog from "../Dialogs/AltNamesDialog";
import KeyValuesDialog from "../Dialogs/KeyValuesDialog";
import TariffZonesDialog from "../Dialogs/TariffZonesDialog";
import ModalityIconSvg from "../MainPage/ModalityIconSvg";
import TagTray from "../MainPage/TagTray";
import BelongsToGroup from "./../MainPage/BelongsToGroup";
import ImportedId from "./ImportedId";
import ModalitiesMenuItems from "./ModalitiesMenuItems";
import TagsDialog from "./TagsDialog";
import ToolTippable from "./ToolTippable";
import WeightingPopover from "./WeightingPopover";
import WheelChairPopover from "./WheelChairPopover";

class StopPlaceDetails extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      stopTypeOpen: false,
      weightingOpen: false,
      name: props.stopPlace.name || "",
      publicCode: props.stopPlace.publicCode || "",
      privateCode: props.stopPlace.privateCode || "",
      description: props.stopPlace.description || "",
      altNamesDialogOpen: false,
      tariffZoneOpen: false,
      tagsOpen: false,
    };

    this.updateStopName = debounce((value) => {
      this.props.dispatch(StopPlaceActions.changeStopName(value));
    }, 200);

    this.updateStopPublicCode = debounce((value) => {
      this.props.dispatch(StopPlaceActions.changeStopPublicCode(value));
    }, 200);

    this.updateStopPrivateCode = debounce((value) => {
      this.props.dispatch(StopPlaceActions.changeStopPrivateCode(value));
    }, 200);

    this.updateStopDescription = debounce((value) => {
      this.props.dispatch(StopPlaceActions.changeStopDescription(value));
    }, 200);
  }

  handleOpenTags() {
    this.setState({
      stopTypeOpen: false,
      weightingOpen: false,
      altNamesDialogOpen: false,
      tariffZoneOpen: false,
      tagsOpen: true,
    });
    if (this.props.keyValuesDialogOpen) {
      this.props.dispatch(UserActions.closeKeyValuesDialog());
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({
      name: nextProps.stopPlace.name || "",
      publicCode: nextProps.stopPlace.publicCode || "",
      privateCode: nextProps.stopPlace.privateCode || "",
      description: nextProps.stopPlace.description || "",
    });
    if (
      nextProps.keyValuesDialogOpen &&
      this.props.keyValuesDialogOpen !== nextProps.keyValuesDialogOpen
    ) {
      this.setState({
        stopTypes: false,
        wheelChairOpen: false,
        altNamesDialogOpen: false,
        weightingOpen: false,
        tariffZoneOpen: false,
        tagsOpen: false,
      });
    }
  }

  handleCloseStopPlaceTypePopover() {
    this.setState({
      stopTypeOpen: false,
    });
  }

  handleOpenKeyValues() {
    this.setState({
      tariffZoneOpen: false,
      altNamesDialogOpen: false,
      tagsOpen: false,
    });
    this.props.dispatch(
      UserActions.openKeyValuesDialog(
        this.props.stopPlace.keyValues,
        "stopPlace",
        null,
      ),
    );
  }

  handleOpenAltNames() {
    this.setState({
      stopTypes: false,
      wheelChairOpen: false,
      altNamesDialogOpen: true,
      weightingOpen: false,
      tariffZoneOpen: false,
      tagsOpen: false,
    });
    if (this.props.keyValuesDialogOpen) {
      this.props.dispatch(UserActions.closeKeyValuesDialog());
    }
  }

  handleOpenTZDialog() {
    this.setState({
      stopTypes: false,
      wheelChairOpen: false,
      altNamesDialogOpen: false,
      weightingOpen: false,
      tariffZoneOpen: true,
      tagsOpen: false,
    });
    if (this.props.keyValuesDialogOpen) {
      this.props.dispatch(UserActions.closeKeyValuesDialog());
    }
  }

  handleOpenStopPlaceTypePopover(event) {
    this.setState({
      stopTypeOpen: true,
      wheelChairOpen: false,
      stopTypeAnchorEl: event.currentTarget,
      altNamesDialogOpen: false,
      weightingOpen: false,
      tagsOpen: false,
    });
  }

  getWeightingStateColor(stopPlace) {
    const weightingValue = stopPlace.weighting;
    return weightColors[weightingValue] || "grey";
  }

  getNameForWeightingState(stopPlace) {
    const weightingValue = stopPlace.weighting;

    for (let i = 0; i < weightTypes.length; i++) {
      if (weightTypes[i] === weightingValue) {
        return this.props.intl.formatMessage({
          id: `weightTypes_${weightingValue}`,
        });
      }
    }

    return this.props.intl.formatMessage({ id: `weightTypes_noValue` });
  }

  handleOpenWeightPopover(event) {
    this.setState({
      weightingOpen: true,
      weightingAnchorEl: event.currentTarget,
      wheelChairOpen: false,
      stopTypeOpen: false,
      altNamesDialogOpen: false,
    });
  }

  handleStopNameChange(event) {
    const name = event.target.value;
    this.setState({
      name: name,
    });

    this.updateStopName(name);
  }

  handleStopPublicCodeChange(event) {
    const publicCode = event.target.value;
    this.setState({
      publicCode,
    });

    this.updateStopPublicCode(publicCode);
  }

  handleStopPrivateCodeChange(event) {
    const privateCode = event.target.value;
    this.setState({
      privateCode,
    });

    this.updateStopPrivateCode(privateCode);
  }

  handleStopDescriptionChange(event) {
    const description = event.target.value;
    this.setState({
      description: description,
    });

    this.updateStopDescription(description);
  }

  handleHandleWheelChair(value) {
    if (!this.props.disabled)
      this.props.dispatch(AssessmentActions.setStopWheelchairAccess(value));
  }

  handleStopTypeChange(stopType) {
    this.handleCloseStopPlaceTypePopover();
    this.props.dispatch(StopPlaceActions.changeStopType(stopType));
  }

  handleSubModeTypeChange(stopType, transportMode, submode) {
    this.handleCloseStopPlaceTypePopover();
    this.props.dispatch(
      StopPlaceActions.changeSubmode(stopType, transportMode, submode),
    );
  }

  handleTicketMachineChange(value) {
    if (!this.props.disabled) {
      this.props.dispatch(
        EquipmentActions.updateTicketMachineState(
          value,
          "stopPlace",
          this.props.stopPlace.id,
        ),
      );
    }
  }

  handleBusShelterChange(value) {
    if (!this.props.disabled) {
      this.props.dispatch(
        EquipmentActions.updateShelterEquipmentState(
          value,
          "stopPlace",
          this.props.stopPlace.id,
        ),
      );
    }
  }

  handleWCChange(value) {
    if (!this.props.disabled) {
      this.props.dispatch(
        EquipmentActions.updateSanitaryState(
          value,
          "stopPlace",
          this.props.stopPlace.id,
        ),
      );
    }
  }

  handleWaitingRoomChange(value) {
    if (!this.props.disabled) {
      this.props.dispatch(
        EquipmentActions.updateWaitingRoomState(
          value,
          "stopPlace",
          this.props.stopPlace.id,
        ),
      );
    }
  }

  handleWeightChange(value) {
    const { dispatch } = this.props;
    dispatch(StopPlaceActions.changeWeightingForStop(value));
    this.setState({
      weightingOpen: false,
    });
  }

  handleChangeSign512(value) {
    if (!this.props.disabled) {
      this.props.dispatch(
        EquipmentActions.update512SignState(
          value,
          "stopPlace",
          this.props.stopPlace.id,
        ),
      );
    }
  }

  getStopTypeTranslation(stopPlaceType, submode) {
    const {
      intl: { formatMessage },
    } = this.props;

    if (submode) {
      return formatMessage({
        id: `stopTypes_${stopPlaceType}_quayItemName`,
      });
    }

    if (stopPlaceType) {
      return formatMessage({ id: `stopTypes_${stopPlaceType}_name` });
    }

    return formatMessage({ id: `stopTypes_unknown` });
  }

  render() {
    const fixedHeader = {
      position: "relative",
      display: "block",
    };

    const {
      stopPlace,
      intl,
      expanded,
      disabled,
      isPublicCodePrivateCodeEnabled,
      dispatch,
    } = this.props;
    const { formatMessage, locale } = intl;

    const isChildOfParent = stopPlace.isChildOfParent;

    const {
      name,
      publicCode,
      privateCode,
      description,
      altNamesDialogOpen,
      weightingOpen,
      tariffZoneOpen,
    } = this.state;

    const wheelchairAccess = getIn(
      stopPlace,
      ["accessibilityAssessment", "limitations", "wheelchairAccess"],
      "UNKNOWN",
    );

    const ticketMachine = equipmentHelpers.getTicketMachineState(stopPlace);
    const busShelter = equipmentHelpers.getShelterEquipmentState(stopPlace);
    const waitingRoom = equipmentHelpers.getWaitingRoomState(stopPlace);
    const WC = equipmentHelpers.getSanitaryEquipmentState(stopPlace);
    const sign512 = equipmentHelpers.get512SignEquipment(stopPlace);

    const hasAltNames = !!(
      stopPlace.alternativeNames && stopPlace.alternativeNames.length
    );

    const stopTypeHint = this.getStopTypeTranslation(
      stopPlace.stopPlaceType,
      stopPlace.submode,
    );
    const weightingStateHint = this.getNameForWeightingState(stopPlace);
    const expirationText = formatMessage({ id: "stop_has_expired" });
    const permanentlyTerminatedText = formatMessage({
      id: "stop_has_been_permanently_terminated",
    });
    const versionLabel = formatMessage({ id: "version" });
    const keyValuesHint = formatMessage({ id: "key_values_hint" });
    const wheelChairHint = formatMessage({
      id: `accessibilityAssessments_wheelchairAccess_${wheelchairAccess.toLowerCase()}`,
    });
    const ticketMachineHint = ticketMachine
      ? formatMessage({ id: "ticketMachine" })
      : formatMessage({ id: "ticketMachine_no" });
    const busShelterHint = busShelter
      ? formatMessage({ id: "busShelter" })
      : formatMessage({ id: "busShelter_no" });
    const WCHint = WC
      ? formatMessage({ id: "wc" })
      : formatMessage({ id: "wc_no" });
    const waitingRoomHint = waitingRoom
      ? formatMessage({ id: "waiting_room" })
      : formatMessage({ id: "waiting_room_no" });
    const transportSignHint = sign512
      ? formatMessage({ id: "transport_sign" })
      : formatMessage({ id: "transport_sign_no" });
    const tariffZonesHint = formatMessage({ id: "tariffZones" });
    const altNamesHint = formatMessage({ id: "alternative_names" });
    const belongsToParent = formatMessage({ id: "belongs_to_parent" });
    const primaryDarker = getPrimaryDarkerColor();

    return (
      <div style={fixedHeader}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            {isChildOfParent && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 600, fontSize: "0.9em" }}>
                  {belongsToParent}
                </span>
                <Link
                  to={`/${Routes.STOP_PLACE}/${getIn(
                    stopPlace,
                    ["parentStop", "id"],
                    null,
                  )}`}
                  style={{ fontSize: "0.8em" }}
                >
                  {stopPlace.parentStop.id}
                </Link>
              </div>
            )}
            {!stopPlace.isNewStop && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontWeight: 600 }}>
                  {versionLabel} {stopPlace.version}
                </span>
                {stopPlace.hasExpired && (
                  <div
                    style={{ display: "flex", alignItems: "center", flex: 2 }}
                  >
                    <MdWarning
                      style={{ marginTop: -5, marginLeft: 10, color: "orange" }}
                    />
                    <span
                      style={{
                        color: "#bb271c",
                        marginLeft: 5,
                        fontSize: "0.8em",
                      }}
                    >
                      {stopPlace.permanentlyTerminated
                        ? permanentlyTerminatedText
                        : expirationText}
                    </span>
                  </div>
                )}
                <FlatButton
                  onClick={this.handleOpenTags.bind(this)}
                  label={formatMessage({ id: "tags" })}
                >
                  {formatMessage({ id: "tags" })}
                </FlatButton>
              </div>
            )}
            <div style={{ padding: 5 }}>
              <TagTray
                tags={stopPlace.tags}
                textSize={"0.7em"}
                style={{ display: "flex", flexWrap: "wrap" }}
              />
            </div>
            <div style={{ display: "flex" }}>
              <ImportedId
                id={stopPlace.importedId}
                text={formatMessage({ id: "local_reference" })}
              />
              <div style={{ display: "flex", marginLeft: "auto" }}>
                <div
                  style={{
                    borderBottom: "1px dotted",
                    marginLeft: 10,
                    marginTop: 0,
                  }}
                >
                  <ToolTippable toolTipText={keyValuesHint}>
                    <IconButton onClick={this.handleOpenKeyValues.bind(this)}>
                      <MdKey
                        style={{
                          color: (stopPlace.keyValues || []).length
                            ? primaryDarker
                            : "#000",
                        }}
                      />
                    </IconButton>
                  </ToolTippable>
                </div>
                <div
                  style={{
                    borderBottom: "1px dotted",
                    marginLeft: 10,
                    marginTop: 0,
                  }}
                >
                  <ToolTippable toolTipText={stopTypeHint}>
                    <IconButton
                      onClick={(e) => {
                        this.handleOpenStopPlaceTypePopover(e);
                      }}
                    >
                      <ModalityIconSvg
                        type={stopPlace.stopPlaceType}
                        submode={stopPlace.submode}
                      />
                    </IconButton>
                  </ToolTippable>
                </div>
                <Menu
                  open={this.state.stopTypeOpen}
                  anchorEl={this.state.stopTypeAnchorEl}
                  anchorOrigin={{ horizontal: "right", vertical: "top" }}
                  targetOrigin={{ horizontal: "right", vertical: "top" }}
                  onClose={this.handleCloseStopPlaceTypePopover.bind(this)}
                  style={{ overflowY: "none" }}
                >
                  <ModalitiesMenuItems
                    handleSubModeTypeChange={this.handleSubModeTypeChange.bind(
                      this,
                    )}
                    handleStopTypeChange={this.handleStopTypeChange.bind(this)}
                    stopPlaceTypeChosen={stopPlace.stopPlaceType}
                    submodeChosen={stopPlace.submode}
                    stopTypes={stopTypes}
                    intl={intl}
                    allowsInfo={this.props.allowsInfo}
                  />
                </Menu>
              </div>
            </div>
          </div>
        </div>
        {stopPlace.belongsToGroup && (
          <BelongsToGroup
            formatMessage={formatMessage}
            groups={stopPlace.groups}
            style={{ marginTop: 5, marginBottom: 15 }}
          />
        )}
        <div style={{ display: "flex", alignItems: "center" }}>
          <TextField
            variant={"standard"}
            hintText={formatMessage({ id: "name" })}
            label={formatMessage({ id: "name" })}
            style={{ marginTop: -10, width: 300 }}
            value={name}
            disabled={disabled}
            error={!(name && name.trim().length)}
            helperText={formatMessage({ id: "name_is_required" })}
            onChange={this.handleStopNameChange.bind(this)}
          />
          <div style={{ display: "flex", alignItems: "center" }}>
            <ToolTippable toolTipText={tariffZonesHint}>
              <div
                onClick={this.handleOpenTZDialog.bind(this)}
                style={{
                  borderBottom: "1px dotted",
                  marginTop: -10,
                  paddingBottom: 4,
                  marginLeft: 28,
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    fontSize: 18,
                    color: (stopPlace.tariffZones || []).length
                      ? primaryDarker
                      : "#000",
                  }}
                >
                  Tz
                </span>
              </div>
            </ToolTippable>
            <div
              style={{
                borderBottom: "1px dotted",
                marginLeft: 10,
                marginTop: -24,
              }}
            >
              <ToolTippable toolTipText={altNamesHint}>
                <IconButton onClick={this.handleOpenAltNames.bind(this)}>
                  <MdLanguage
                    style={{ color: hasAltNames ? primaryDarker : "#000" }}
                  />
                </IconButton>
              </ToolTippable>
            </div>
          </div>
        </div>
        {isPublicCodePrivateCodeEnabled && (
          <div style={{ display: "flex", alignItems: "center" }}>
            <TextField
              variant={"standard"}
              hintText={formatMessage({ id: "publicCode" })}
              label={formatMessage({ id: "publicCode" })}
              style={{ width: 170, marginRight: 25 }}
              disabled={disabled}
              value={publicCode}
              onChange={this.handleStopPublicCodeChange.bind(this)}
            />
            <TextField
              variant={"standard"}
              hintText={formatMessage({ id: "privateCode" })}
              label={formatMessage({ id: "privateCode" })}
              style={{ width: 170, marginRight: 25 }}
              disabled={disabled}
              value={privateCode}
              onChange={this.handleStopPrivateCodeChange.bind(this)}
            />
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center" }}>
          <TextField
            variant={"standard"}
            hintText={formatMessage({ id: "description" })}
            label={formatMessage({ id: "description" })}
            style={{ width: 340, marginRight: 10 }}
            disabled={disabled}
            value={description}
            onChange={this.handleStopDescriptionChange.bind(this)}
          />
          <ToolTippable toolTipText={weightingStateHint}>
            <IconButton
              onClick={(e) => {
                this.handleOpenWeightPopover(e);
              }}
              style={{ paddingTop: 12 }}
            >
              <MdTransfer
                style={{ color: this.getWeightingStateColor(stopPlace) }}
              />
            </IconButton>
            <div
              style={{
                borderBottom: "1px dotted",
              }}
            ></div>
            <WeightingPopover
              open={!disabled && weightingOpen}
              anchorEl={this.state.weightingAnchorEl}
              handleChange={(v) => this.handleWeightChange(v)}
              locale={locale}
              handleClose={() => {
                this.setState({ weightingOpen: false });
              }}
            />
          </ToolTippable>
        </div>
        {expanded ? null : (
          <div
            style={{
              marginTop: 20,
              marginBottom: 10,
              height: 15,
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
            }}
          >
            <ToolTippable toolTipText={wheelChairHint}>
              <WheelChairPopover
                intl={intl}
                handleChange={this.handleHandleWheelChair.bind(this)}
                wheelchairAccess={wheelchairAccess}
              />
              <div
                style={{
                  borderBottom: "1px dotted",
                }}
              ></div>
            </ToolTippable>

            <ToolTippable toolTipText={ticketMachineHint}>
              <Checkbox
                checkedIcon={<TicketMachine style={{ fill: "#000" }} />}
                icon={
                  <TicketMachine style={{ fill: "#8c8c8c", opacity: "0.8" }} />
                }
                style={{ width: "auto" }}
                checked={ticketMachine}
                onChange={(e, v) => {
                  this.handleTicketMachineChange(v);
                }}
              />
            </ToolTippable>
            <ToolTippable toolTipText={busShelterHint}>
              <Checkbox
                checkedIcon={<BusShelter style={{ fill: "#000" }} />}
                icon={
                  <BusShelter style={{ fill: "#8c8c8c", opacity: "0.8" }} />
                }
                style={{ width: "auto" }}
                checked={busShelter}
                onChange={(e, v) => {
                  this.handleBusShelterChange(v);
                }}
              />
            </ToolTippable>
            <ToolTippable toolTipText={WCHint}>
              <Checkbox
                checkedIcon={<MdWC style={{ fill: "#000" }} />}
                icon={<MdWC style={{ fill: "#8c8c8c", opacity: "0.8" }} />}
                style={{ width: "auto" }}
                checked={WC}
                onChange={(e, v) => {
                  this.handleWCChange(v);
                }}
              />
            </ToolTippable>
            <ToolTippable toolTipText={waitingRoomHint}>
              <Checkbox
                checkedIcon={<WaitingRoom style={{ fill: "#000" }} />}
                icon={
                  <WaitingRoom style={{ fill: "#8c8c8c", opacity: "0.8" }} />
                }
                style={{ width: "auto" }}
                checked={waitingRoom}
                onChange={(e, v) => {
                  this.handleWaitingRoomChange(v);
                }}
              />
            </ToolTippable>
            <ToolTippable toolTipText={transportSignHint}>
              <Checkbox
                icon={
                  <TransportSign
                    style={{
                      fill: "#8c8c8c",
                      opacity: "0.8",
                    }}
                  />
                }
                checkedIcon={<TransportSign />}
                style={{ width: "auto" }}
                checked={sign512}
                onChange={(e, v) => {
                  this.handleChangeSign512(v);
                }}
              />
            </ToolTippable>
          </div>
        )}
        <AltNamesDialog
          open={altNamesDialogOpen}
          altNames={stopPlace.alternativeNames}
          intl={intl}
          disabled={disabled}
          handleClose={() => {
            this.setState({ altNamesDialogOpen: false });
          }}
        />
        <TagsDialog
          open={this.state.tagsOpen}
          tags={stopPlace.tags}
          intl={intl}
          disabled={disabled}
          handleClose={() => {
            this.setState({ tagsOpen: false });
          }}
          idReference={stopPlace.id}
          addTag={(idReference, name, comment) =>
            dispatch(addTag(idReference, name, comment))
          }
          getTags={(idReference) => dispatch(getTags(idReference))}
          removeTag={(name, idReference) =>
            dispatch(removeTag(name, idReference))
          }
          findTagByName={(name) => dispatch(findTagByName(name))}
        />
        <TariffZonesDialog
          open={tariffZoneOpen}
          tariffZones={stopPlace.tariffZones}
          fareZones={stopPlace.fareZones}
          intl={intl}
          disabled={disabled}
          handleClose={() => {
            this.setState({ tariffZoneOpen: false });
          }}
        />
        <KeyValuesDialog intl={intl} disabled={disabled} />
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  const stopPlace = state.stopPlace.current;
  const allowsInfo = stopPlace.permissions
    ? getStopPermissions(state.stopPlace.current)
    : getAllowanceInfoFromLocationPermissions(state.user.locationPermissions);
  return {
    stopPlace,
    isPublicCodePrivateCodeEnabled:
      state.stopPlace.enablePublicCodePrivateCodeOnStopPlaces,
    keyValuesDialogOpen: state.user.keyValuesDialogOpen,
    allowsInfo,
  };
};

export default connect(mapStateToProps)(StopPlaceDetails);
