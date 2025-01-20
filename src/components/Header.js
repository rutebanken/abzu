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

import { Check } from "@mui/icons-material";
import MdAccount from "@mui/icons-material/AccountCircle";
import MdHelp from "@mui/icons-material/Help";
import MdLanguage from "@mui/icons-material/Language";
import MdMap from "@mui/icons-material/Map";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import MdReport from "@mui/icons-material/Report";
import MdSettings from "@mui/icons-material/Settings";
import { Button } from "@mui/material";
import AppBar from "@mui/material/AppBar";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import React from "react";
import { Helmet } from "react-helmet";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { UserActions } from "../actions/";
import {
  getEnvColor,
  getLogo,
  getTheme,
  getTiamatEnv,
} from "../config/themeConfig";
import {
  toggleShowFareZonesInMap,
  toggleShowTariffZonesInMap,
} from "../reducers/zonesSlice";
import { getIn } from "../utils";
import ConfirmDialog from "./Dialogs/ConfirmDialog";
import MoreMenuItem from "./MainPage/MoreMenuItem";

class Header extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isConfirmDialogOpen: false,
      actionOnDone: "GoToMain",
    };
  }

  goToMain() {
    this.props.dispatch(UserActions.navigateTo("/", ""));
  }

  handleConfirmChangeRoute(next, action) {
    const {
      stopHasBeenModified,
      isDisplayingReports,
      isDisplayingEditStopPlace,
    } = this.props;

    if (isDisplayingReports) {
      next();
    } else if (stopHasBeenModified && isDisplayingEditStopPlace) {
      this.setState({
        isConfirmDialogOpen: true,
        actionOnDone: action,
      });
    } else {
      next();
    }
  }

  handleSetLanguage(locale) {
    this.props.dispatch(UserActions.applyLocale(locale));
  }

  handleConfirm() {
    this.setState({
      isConfirmDialogOpen: false,
    });

    const { actionOnDone } = this.state;
    switch (actionOnDone) {
      case "GoToMain":
        this.goToMain();
        break;
      case "GoToReports":
        this.goToReports();
        break;
      default:
        console.info("Invalid action", actionOnDone, " ignored");
        break;
    }
  }

  handleLogOut() {
    if (this.props.auth) {
      this.props.auth.logout({ returnTo: window.location.origin });
    }
  }

  handleLogin() {
    if (this.props.auth) {
      this.props.auth.login();
    }
  }

  goToReports() {
    this.props.dispatch(UserActions.navigateTo("reports", ""));
  }

  handleTogglePublicCodePrivateCodeOnStopPlaces(value) {
    this.props.dispatch(
      UserActions.toggleEnablePublicCodePrivateCodeOnStopPlaces(value),
    );
  }

  handleToggleMultiPolylines(value) {
    this.props.dispatch(UserActions.togglePathLinksEnabled(value));
  }

  handleToggleCompassBearing(value) {
    this.props.dispatch(UserActions.toggleCompassBearingEnabled(value));
  }

  handleToggleShowExpiredStops(value) {
    this.props.dispatch(UserActions.toggleExpiredShowExpiredStops(value));
  }

  handleToggleMultimodalEdges(value) {
    this.props.dispatch(UserActions.toggleMultimodalEdges(value));
  }

  handleToggleShowPublicCode(value) {
    this.props.dispatch(UserActions.toggleShowPublicCode(value));
  }

  handleToggleShowFareZones(value) {
    this.props.dispatch(toggleShowTariffZonesInMap(false));
    this.props.dispatch(toggleShowFareZonesInMap(value));
  }

  handleToggleShowTariffZones(value) {
    this.props.dispatch(toggleShowFareZonesInMap(false));
    this.props.dispatch(toggleShowTariffZonesInMap(value));
  }

  state = {
    anchorEl: null,
  };

  handleClick = (event) => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleClose = () => {
    this.setState({ anchorEl: null });
  };
  render() {
    const {
      intl,
      auth,
      isPublicCodePrivateCodeOnStopPlacesEnabled,
      isMultiPolylinesEnabled,
      isCompassBearingEnabled,
      showExpiredStops,
      showMultimodalEdges,
      showPublicCode,
      showFareZones,
      showTariffZones,
    } = this.props;

    const { formatMessage, locale } = intl;

    const title = formatMessage({ id: "_title" });
    const language = formatMessage({ id: "language" });
    const english = formatMessage({ id: "english" });
    const norwegian = formatMessage({ id: "norwegian" });
    const swedish = formatMessage({ id: "swedish" });
    const french = formatMessage({ id: "french" });
    const logOut = formatMessage({ id: "log_out" });
    const logIn = formatMessage({ id: "log_in" });
    const settings = formatMessage({ id: "settings" });
    const publicCodePrivateCodeSetting = formatMessage({
      id: "publicCode_privateCode_setting_label",
    });
    const mapSettings = formatMessage({ id: "map_settings" });
    const showPathLinks = formatMessage({ id: "show_path_links" });
    const showCompassBearing = formatMessage({ id: "show_compass_bearing" });
    const reportSite = formatMessage({ id: "report_site" });
    const expiredStopLabel = formatMessage({ id: "show_expired_stops" });
    const userGuide = formatMessage({ id: "user_guide" });
    const username = getIn(auth, ["user", "name"], "");
    const showMultimodalEdgesLabel = formatMessage({
      id: "show_multimodal_edges",
    });
    const showPublicCodeLabel = formatMessage({ id: "show_public_code" });
    const showPrivateCodeLabel = formatMessage({ id: "show_private_code" });
    const quayCodeShowingLabel = formatMessage({ id: "quay_marker_label" });
    const showFareZonesLabel = formatMessage({ id: "show_fare_zones_label" });
    const showTariffZonesLabel = formatMessage({
      id: "show_tariff_zones_label",
    });

    const tiamatEnv = getTiamatEnv();
    const headerColor = getEnvColor(tiamatEnv);
    const theme = getTheme();
    const logo = getLogo();
    const { anchorEl } = this.state;

    return (
      <div>
        <Helmet
          defaultTitle={formatMessage({ id: "_title" })}
          titleTemplate={`${formatMessage({ id: "_title" })} - %s`}
        />
        <AppBar position="static" sx={{ background: headerColor }}>
          <Toolbar>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2 }}
              onClick={() =>
                this.handleConfirmChangeRoute(
                  this.goToMain.bind(this),
                  "GoToMain",
                )
              }
            >
              <img
                alt=""
                src={logo}
                style={{ width: 40, height: "auto", cursor: "pointer" }}
              />
            </IconButton>

            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              <div
                style={{
                  fontSize: 24,
                  display: "flex",
                  justifyContent: "space-between",
                  color: "#fff",
                }}
              >
                <div>
                  {title}
                  {(tiamatEnv === "test" || tiamatEnv === "development") && (
                    <span
                      style={{ fontSize: 18, marginLeft: 8, color: "#ddffa5" }}
                    >
                      {tiamatEnv}
                    </span>
                  )}
                </div>
              </div>
            </Typography>

            <div style={{ height: "36px" }}>
              {!this.props.auth.isAuthenticated && (
                <Button
                  variant="contained"
                  onClick={() => this.handleLogin()}
                  sx={{ mr: 2 }}
                  color={"primary2Color"}
                >
                  {logIn}
                </Button>
              )}
            </div>

            <IconButton
              aria-owns={anchorEl ? "simple-menu" : undefined}
              aria-haspopup="true"
              onClick={this.handleClick}
            >
              <MoreVertIcon color={"alternateTextColor"} />
            </IconButton>
            <Menu
              id="simple-menu"
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={this.handleClose}
            >
              <MenuItem
                onClick={() =>
                  this.handleConfirmChangeRoute(
                    this.goToReports.bind(this),
                    "GoToReports",
                  )
                }
                style={{
                  fontSize: 12,
                  padding: 0,
                  paddingBottom: 5,
                  paddingTop: 5,
                  width: 300,
                }}
              >
                <MdReport color="#41c0c4" />
                {reportSite}
              </MenuItem>
              <MoreMenuItem
                openLeft={true}
                leftIcon={<MdSettings color="#41c0c4" />}
                label={settings}
                style={{
                  fontSize: 12,
                  padding: 0,
                  paddingBottom: 5,
                  paddingTop: 5,
                  width: 300,
                }}
              >
                <MenuItem
                  style={{
                    fontSize: 12,
                    padding: 0,
                    paddingBottom: 5,
                    paddingTop: 5,
                    width: 300,
                  }}
                  onClick={() =>
                    this.handleTogglePublicCodePrivateCodeOnStopPlaces(
                      !isPublicCodePrivateCodeOnStopPlacesEnabled,
                    )
                  }
                >
                  {isPublicCodePrivateCodeOnStopPlacesEnabled ? (
                    <Check />
                  ) : (
                    <div style={{ width: "24px", height: "24px" }} />
                  )}
                  {publicCodePrivateCodeSetting}
                </MenuItem>
              </MoreMenuItem>
              <MoreMenuItem
                openLeft={true}
                leftIcon={<MdMap color="#41c0c4" />}
                label={mapSettings}
                style={{
                  fontSize: 12,
                  padding: 0,
                  paddingBottom: 5,
                  paddingTop: 5,
                  width: 300,
                }}
              >
                <MenuItem
                  style={{
                    fontSize: 12,
                    padding: 0,
                    paddingBottom: 5,
                    paddingTop: 5,
                    width: 300,
                  }}
                  onClick={() =>
                    this.handleToggleMultiPolylines(!isMultiPolylinesEnabled)
                  }
                >
                  {isMultiPolylinesEnabled ? (
                    <Check />
                  ) : (
                    <div style={{ width: "24px", height: "24px" }} />
                  )}
                  {showPathLinks}
                </MenuItem>

                <MenuItem
                  style={{
                    fontSize: 12,
                    padding: 0,
                    paddingBottom: 5,
                    paddingTop: 5,
                    width: 300,
                  }}
                  onClick={() =>
                    this.handleToggleCompassBearing(!isCompassBearingEnabled)
                  }
                >
                  {isCompassBearingEnabled ? (
                    <Check />
                  ) : (
                    <div style={{ width: "24px", height: "24px" }} />
                  )}
                  {showCompassBearing}
                </MenuItem>

                <MenuItem
                  style={{
                    fontSize: 12,
                    padding: 0,
                    paddingBottom: 5,
                    paddingTop: 5,
                    width: 300,
                  }}
                  onClick={() =>
                    this.handleToggleShowExpiredStops(!showExpiredStops)
                  }
                >
                  {showExpiredStops ? (
                    <Check />
                  ) : (
                    <div style={{ width: "24px", height: "24px" }} />
                  )}
                  {expiredStopLabel}
                </MenuItem>

                <MenuItem
                  style={{
                    fontSize: 12,
                    padding: 0,
                    paddingBottom: 5,
                    paddingTop: 5,
                    width: 300,
                  }}
                  onClick={() =>
                    this.handleToggleMultimodalEdges(!showMultimodalEdges)
                  }
                >
                  {showMultimodalEdges ? (
                    <Check />
                  ) : (
                    <div style={{ width: "24px", height: "24px" }} />
                  )}
                  {showMultimodalEdgesLabel}
                </MenuItem>

                <MoreMenuItem
                  openLeft={false}
                  style={{
                    fontSize: 12,
                    padding: 0,
                    paddingBottom: 5,
                    paddingTop: 5,
                    width: 300,
                  }}
                  leftIcon={<div style={{ width: "24px", height: "24px" }} />}
                  label={quayCodeShowingLabel}
                >
                  <MenuItem
                    style={{
                      fontSize: 12,
                      padding: 0,
                      paddingBottom: 5,
                      paddingTop: 5,
                      width: 300,
                    }}
                    onClick={() => this.handleToggleShowPublicCode(true)}
                  >
                    {showPublicCode ? (
                      <Check />
                    ) : (
                      <div style={{ width: "24px", height: "24px" }} />
                    )}
                    {showPublicCodeLabel}
                  </MenuItem>

                  <MenuItem
                    style={{
                      fontSize: 12,
                      padding: 0,
                      paddingBottom: 5,
                      paddingTop: 5,
                      width: 300,
                    }}
                    onClick={() => this.handleToggleShowPublicCode(false)}
                  >
                    {!showPublicCode ? (
                      <Check />
                    ) : (
                      <div style={{ width: "24px", height: "24px" }} />
                    )}
                    {showPrivateCodeLabel}
                  </MenuItem>
                </MoreMenuItem>

                <MenuItem
                  style={{
                    fontSize: 12,
                    padding: 0,
                    paddingBottom: 5,
                    paddingTop: 5,
                    width: 300,
                  }}
                  onClick={() => this.handleToggleShowFareZones(!showFareZones)}
                >
                  {showFareZones ? (
                    <Check />
                  ) : (
                    <div style={{ width: "24px", height: "24px" }} />
                  )}
                  {showFareZonesLabel}
                </MenuItem>

                <MenuItem
                  style={{
                    fontSize: 12,
                    padding: 0,
                    paddingBottom: 5,
                    paddingTop: 5,
                    width: 300,
                  }}
                  onClick={() =>
                    this.handleToggleShowTariffZones(!showTariffZones)
                  }
                  checked={showTariffZones}
                >
                  {showTariffZones ? (
                    <Check />
                  ) : (
                    <div style={{ width: "24px", height: "24px" }} />
                  )}
                  {showTariffZonesLabel}
                </MenuItem>
              </MoreMenuItem>
              <MoreMenuItem
                openLeft={true}
                leftIcon={<MdLanguage color="#41c0c4" />}
                label={language}
                style={{
                  fontSize: 12,
                  padding: 0,
                  paddingBottom: 5,
                  paddingTop: 5,
                  width: 300,
                }}
              >
                <MenuItem
                  style={{
                    fontSize: 12,
                    padding: 0,
                    paddingBottom: 5,
                    paddingTop: 5,
                    width: 300,
                  }}
                  onClick={() => this.handleSetLanguage("nb")}
                  checked={locale === "nb"}
                >
                  {locale === "nb" ? (
                    <Check />
                  ) : (
                    <div style={{ width: "24px", height: "24px" }} />
                  )}
                  {norwegian}
                </MenuItem>
                <MenuItem
                  style={{
                    fontSize: 12,
                    padding: 0,
                    paddingBottom: 5,
                    paddingTop: 5,
                    width: 300,
                  }}
                  onClick={() => this.handleSetLanguage("en")}
                  checked={locale === "en"}
                >
                  {locale === "en" ? (
                    <Check />
                  ) : (
                    <div style={{ width: "24px", height: "24px" }} />
                  )}
                  {english}
                </MenuItem>
                <MenuItem
                  style={{
                    fontSize: 12,
                    padding: 0,
                    paddingBottom: 5,
                    paddingTop: 5,
                    width: 300,
                  }}
                  onClick={() => this.handleSetLanguage("fr")}
                  checked={locale === "fr"}
                >
                  {locale === "fr" ? (
                    <Check />
                  ) : (
                    <div style={{ width: "24px", height: "24px" }} />
                  )}
                  {french}
                </MenuItem>
                <MenuItem
                  style={{
                    fontSize: 12,
                    padding: 0,
                    paddingBottom: 5,
                    paddingTop: 5,
                    width: 300,
                  }}
                  onClick={() => this.handleSetLanguage("sv")}
                  checked={locale === "sv"}
                >
                  {locale === "sv" ? (
                    <Check />
                  ) : (
                    <div style={{ width: "24px", height: "24px" }} />
                  )}
                  {swedish}
                </MenuItem>
              </MoreMenuItem>
              <MenuItem
                component={"a"}
                href="https://enturas.atlassian.net/wiki/spaces/PUBLIC/pages/1225523302/User+guide+national+stop+place+registry"
                target="_blank"
                style={{
                  fontSize: 12,
                  padding: 0,
                  paddingBottom: 5,
                  paddingTop: 5,
                  width: 300,
                }}
              >
                <MdHelp color="#41c0c4" />
                {userGuide}
              </MenuItem>

              {this.props.auth.isAuthenticated && (
                <MenuItem
                  leftIcon={<MdAccount color="#41c0c4" />}
                  onClick={() => this.handleLogOut()}
                  style={{
                    fontSize: 12,
                    padding: 0,
                    paddingBottom: 5,
                    paddingTop: 5,
                    width: 300,
                  }}
                >
                  <MdAccount color="#41c0c4" />
                  {`${logOut} ${username}`}
                </MenuItem>
              )}
            </Menu>
          </Toolbar>
        </AppBar>

        <ConfirmDialog
          open={this.state.isConfirmDialogOpen}
          handleClose={() => {
            this.setState({
              isConfirmDialogOpen: false,
            });
          }}
          handleConfirm={() => {
            this.handleConfirm();
          }}
          messagesById={{
            title: "discard_changes_title",
            body: "discard_changes_body",
            confirm: "discard_changes_confirm",
            cancel: "discard_changes_cancel",
          }}
          intl={intl}
        />
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  auth: state.user.auth,
  isCompassBearingEnabled: state.stopPlace.isCompassBearingEnabled,
  isDisplayingEditStopPlace:
    state.router.location.pathname.indexOf("/stop_place/") > -1,
  isDisplayingReports: state.router.location.pathname === "/reports",
  isPublicCodePrivateCodeOnStopPlacesEnabled:
    state.stopPlace.enablePublicCodePrivateCodeOnStopPlaces,
  isMultiPolylinesEnabled: state.stopPlace.enablePolylines,
  showExpiredStops: state.stopPlace.showExpiredStops,
  showMultimodalEdges: state.stopPlace.showMultimodalEdges,
  showPublicCode: state.user.showPublicCode,
  stopHasBeenModified: state.stopPlace.stopHasBeenModified,
  showFareZones: state.zones.showFareZones,
  showTariffZones: state.zones.showTariffZones,
});

export default injectIntl(connect(mapStateToProps)(Header));
