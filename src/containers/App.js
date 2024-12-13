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

import React, { useEffect } from "react";
import {
  ThemeProvider,
  createTheme,
  StyledEngineProvider,
} from "@mui/material/styles";

import { IntlProvider } from "react-intl";
import { useDispatch } from "react-redux";
import Header from "../components/Header";
import { getTheme, getV0Theme } from "../config/themeConfig";
import SnackbarWrapper from "../components/SnackbarWrapper";
import { fetchUserPermissions, updateAuth } from "../actions/RolesActions";
import { useAppSelector } from "../store/hooks";
import configureLocalization from "../localization/localization";
import { UserActions } from "../actions";
import { Helmet } from "react-helmet";
import { useAuth } from "../auth/auth";
import MuiThemeProvider from "@mui/material/styles/ThemeProvider";

const muiTheme = createTheme(getTheme());

const App = ({ children }) => {
  const auth = useAuth();
  const dispatch = useDispatch();

  const localization = useAppSelector((state) => state.user.localization);
  const appliedLocale = useAppSelector((state) => state.user.appliedLocale);

  useEffect(() => {
    configureLocalization(appliedLocale).then((localization) => {
      dispatch(UserActions.changeLocalization(localization));
    });
  }, [appliedLocale]);

  useEffect(() => {
    dispatch(updateAuth(auth));
    if (!auth.isLoading) {
      dispatch(fetchUserPermissions());
    }
  }, [auth]);

  if (localization.locale === null) {
    return null;
  }

  return (
    <IntlProvider
      key={localization.locale}
      locale={localization.locale}
      messages={localization.messages}
    >
      <Helmet>
        <html lang={localization.locale} />
      </Helmet>
      <StyledEngineProvider injectFirst>
        <MuiThemeProvider theme={muiTheme}>
          <div>
            <Header />
            {children}
            <SnackbarWrapper />
          </div>
        </MuiThemeProvider>
      </StyledEngineProvider>
    </IntlProvider>
  );
};

export default App;
