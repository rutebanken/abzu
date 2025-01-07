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

import MdBack from "@mui/icons-material/ArrowBack";
import MdSave from "@mui/icons-material/Save";
import MdUndo from "@mui/icons-material/Undo";
import FlatButton from "@mui/material/Button";
import { Component } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { StopPlacesGroupActions, UserActions } from "../../actions/";
import {
  deleteGroupOfStopPlaces,
  mutateGroupOfStopPlace,
} from "../../actions/TiamatActions";
import * as types from "../../actions/Types";
import mapHelper from "../../modelUtils/mapToQueryVariables";
import Routes from "../../routes/";
import { getStopPermissions } from "../../utils/permissionsUtils";
import ConfirmDialog from "../Dialogs/ConfirmDialog";
import SaveGroupDialog from "../Dialogs/SaveGroupDialog";
import GroupOfStopPlaceDetails from "./GroupOfStopPlacesDetails";

class EditGroupOfStopPlaces extends Component {
  constructor(props) {
    super(props);
    this.state = {
      confirmSaveDialogOpen: false,
      confirmGoBack: false,
      confirmUndo: false,
      confirmUndoOpen: false,
      confirmDeleteDialogOpen: false,
    };
  }

  handleAllowUserToGoBack() {
    if (this.props.isModified) {
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
    this.props.dispatch(StopPlacesGroupActions.discardChanges());
  }

  handleGoBack() {
    this.setState({
      confirmGoBack: false,
    });
    this.props.dispatch(UserActions.navigateTo("/", ""));
  }

  handleSaveSuccess(groupId) {
    const { dispatch } = this.props;

    this.setState({
      confirmSaveDialogOpen: false,
    });

    if (groupId) {
      dispatch(
        UserActions.navigateTo(`/${Routes.GROUP_OF_STOP_PLACE}/`, groupId),
      );
      dispatch(UserActions.openSnackbar(types.SUCCESS));
    }
  }

  handleDeleteGroup() {
    const { dispatch, groupOfStopPlaces } = this.props;
    dispatch(deleteGroupOfStopPlaces(groupOfStopPlaces.id)).then((response) => {
      dispatch(UserActions.navigateTo("/", ""));
    });
  }

  getHeaderText(groupOfStopPlaces, formatMessage) {
    if (groupOfStopPlaces.id) {
      return `${groupOfStopPlaces.name} (${groupOfStopPlaces.id})`;
    }
    return formatMessage({ id: "you_are_creating_group" });
  }

  handleSave() {
    const { groupOfStopPlaces, dispatch } = this.props;
    const variables =
      mapHelper.mapGroupOfStopPlaceToVariables(groupOfStopPlaces);
    dispatch(mutateGroupOfStopPlace(variables)).then((groupId) => {
      this.handleSaveSuccess(groupId);
    });
  }

  render() {
    const style = {
      position: "absolute",
      zIndex: 999,
      background: "#fff",
      border: "1px solid #000",
      marginTop: 1,
      marginLeft: 2,
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

    const { formatMessage } = this.props.intl;
    const { originalGOS, groupOfStopPlaces, canEdit, canDelete } = this.props;

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
            <div>{this.getHeaderText(originalGOS, formatMessage)}</div>
          </div>
        </div>
        <div style={{ fontSize: "1em", fontWeight: 600, padding: 5 }}>
          {formatMessage({ id: "group_of_stop_places" })}
        </div>
        <GroupOfStopPlaceDetails
          formatMessage={formatMessage}
          canEdit={canEdit}
        />
        <div
          style={{
            border: "1px solid #efeeef",
            textAlign: "right",
            width: "100%",
            display: "flex",
            justifyContent: "space-around",
          }}
        >
          {groupOfStopPlaces.id && (
            <FlatButton
              label={formatMessage({ id: "remove" })}
              style={{
                margin: "8 5",
                zIndex: 999,
                fontSize: "0.7em",
                color: "#000",
              }}
              disabled={!canDelete}
              onClick={() => {
                this.setState({ confirmDeleteDialogOpen: true });
              }}
            >
              {formatMessage({ id: "remove" })}
            </FlatButton>
          )}
          <FlatButton
            icon={<MdUndo style={{ height: "1.3em", width: "1.3em" }} />}
            disabled={!this.props.isModified}
            label={formatMessage({ id: "undo_changes" })}
            style={{
              fontSize: "0.7em",
              zIndex: 999,
              color:
                !this.props.isModified || !groupOfStopPlaces.name || !canEdit
                  ? "#999"
                  : "#000",
            }}
            onClick={() => {
              this.setState({ confirmUndoOpen: true });
            }}
          >
            <MdUndo style={{ height: "1em", width: "1em" }} />
            {formatMessage({ id: "undo_changes" })}
          </FlatButton>
          <FlatButton
            disabled={
              !this.props.isModified || !groupOfStopPlaces.name || !canEdit
            }
            label={formatMessage({ id: "save" })}
            style={{
              fontSize: "0.7em",
              zIndex: 999,
              color:
                !this.props.isModified || !groupOfStopPlaces.name || !canEdit
                  ? "#999"
                  : "#000",
            }}
            onClick={() => {
              this.setState({ confirmSaveDialogOpen: true });
            }}
          >
            <MdSave style={{ height: "0.7em", width: "0.7em" }} />
            {formatMessage({ id: "save" })}
          </FlatButton>
        </div>
        <SaveGroupDialog
          handleSave={this.handleSave.bind(this)}
          open={this.state.confirmSaveDialogOpen}
          handleClose={() => {
            this.setState({ confirmSaveDialogOpen: false });
          }}
        />
        <ConfirmDialog
          open={this.state.confirmGoBack}
          handleClose={() => {
            this.setState({
              confirmGoBack: false,
            });
          }}
          handleConfirm={() => {
            this.handleGoBack();
          }}
          messagesById={{
            title: "discard_changes_title",
            body: "discard_changes_group_body",
            confirm: "discard_changes_confirm",
            cancel: "discard_changes_cancel",
          }}
          intl={this.props.intl}
        />
        <ConfirmDialog
          open={this.state.confirmUndoOpen}
          handleClose={() => {
            this.setState({
              confirmUndoOpen: false,
            });
          }}
          handleConfirm={() => {
            this.handleDiscardChanges();
          }}
          messagesById={{
            title: "discard_changes_title",
            body: "discard_changes_group_body",
            confirm: "discard_changes_confirm",
            cancel: "discard_changes_cancel",
          }}
          intl={this.props.intl}
        />
        <ConfirmDialog
          open={this.state.confirmDeleteDialogOpen}
          handleClose={() => {
            this.setState({
              confirmDeleteDialogOpen: false,
            });
          }}
          handleConfirm={() => {
            this.handleDeleteGroup();
          }}
          messagesById={{
            title: "delete_group_title",
            body: "delete_group_body",
            confirm: "delete_group_confirm",
            cancel: "delete_group_cancel",
          }}
          intl={this.props.intl}
        />
      </div>
    );
  }
}

const mapStateToProps = ({ stopPlacesGroup }) => ({
  isModified: stopPlacesGroup.isModified,
  groupOfStopPlaces: stopPlacesGroup.current,
  originalGOS: stopPlacesGroup.original,
  canEdit: getStopPermissions(stopPlacesGroup.current).canEdit,
  canDelete: getStopPermissions(stopPlacesGroup.current).canDelete,
});

export default connect(mapStateToProps)(injectIntl(EditGroupOfStopPlaces));
