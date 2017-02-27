import { connect } from 'react-redux'
import React, { Component, PropTypes } from 'react'
import FlatButton from 'material-ui/FlatButton'
import { MapActions, UserActions } from '../actions/'
import stopTypes from '../components/stopTypes'
import { injectIntl } from 'react-intl'
import ConfirmDialog from '../components/ConfirmDialog'
import EditStopBoxTabs from './EditStopBoxTabs'
import { Tabs, Tab } from 'material-ui/Tabs'
import EditStopBoxHeader from '../components/EditStopBoxHeader'
import { withApollo } from 'react-apollo'
import mapToMutationVariables from '../modelUtils/mapToQueryVariables'
import { mutateStopPlace, mutatePathLink } from '../actions/Mutations'
import * as types from '../actions/Types'
import EditQuayAdditional from './EditQuayAdditional'
import EditStopAdditional from './EditStopAdditional'
import MdUndo from 'material-ui/svg-icons/content/undo'
import MdSave from 'material-ui/svg-icons/content/save'
import MdBack from 'material-ui/svg-icons/navigation/arrow-back'
import MdMore from 'material-ui/svg-icons/navigation/expand-more'
import MdLess from 'material-ui/svg-icons/navigation/expand-less'

class EditStopGeneral extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      confirmDialogOpen: false,
    }
  }

  handleSave() {

    const stopPlaceVariables = mapToMutationVariables.mapStopToVariables(this.props.stopPlace)
    const pathLinkVariables = mapToMutationVariables.mapPathLinkToVariables(this.props.pathLink)

    const { client, dispatch } = this.props
    client.mutate({ variables: stopPlaceVariables, mutation: mutateStopPlace}).then( result => {
      if (result.data.mutateStopPlace[0].id) {
        dispatch( UserActions.navigateTo('/edit/', result.data.mutateStopPlace[0].id))
      }
    }).then( result => {

      if (pathLinkVariables && pathLinkVariables.length) {

        client.mutate({ variables: { "PathLink": pathLinkVariables }, mutation: mutatePathLink}).then( result => {
          dispatch( UserActions.openSnackbar(types.SNACKBAR_MESSAGE_SAVED))
        }).catch( err => {
          dispatch( UserActions.openSnackbar(types.SNACKBAR_MESSAGE_FAILED))
        })
      }
    })
  }

  handleGoBack() {
    this.props.dispatch(UserActions.navigateTo('/', ''))
  }

  handleDiscardChanges() {
    this.setState({
      confirmDialogOpen: false
    })
    this.props.dispatch(MapActions.discardChangesForEditingStop())
  }

  handleSlideChange(value) {
    this.props.dispatch(UserActions.changeElementTypeTab(value))
  }

  showMoreStopPlace() {
    this.props.dispatch(UserActions.showEditStopAdditional())
  }

  showLessStopPlace = () => {
    this.props.dispatch(UserActions.hideEditStopAdditional())
  }

  handleDialogClose() {
    this.setState({
      confirmDialogOpen: false
    })
  }

  render() {

    const { stopPlace, stopHasBeenModified, activeElementTab, intl, showEditStopAdditional, showEditQuayAdditional } = this.props
    const { formatMessage, locale } = intl

    const itemTranslation = {
      name: formatMessage({id: 'name'}),
        publicCode: formatMessage({id: 'publicCode'}),
        description: formatMessage({id: 'description'}),
        unsaved: formatMessage({id: 'unsaved'}),
        undefined: formatMessage({id: 'undefined'}),
        none: formatMessage({id: 'none_no'}),
        quays: formatMessage({id: 'quays'}),
        pathJunctions: formatMessage({id: 'pathJunctions'}),
        entrances: formatMessage({id: 'entrances'}),
    }

    if (!stopPlace) return null

    let quayItemName = null

    stopTypes[locale].forEach(stopType => {
      if (stopType.value === stopPlace.stopPlaceType) {
        quayItemName = stopType.quayItemName
      }
    })

    if (quayItemName !== null) {
      itemTranslation.quayItemName = formatMessage({id: quayItemName || 'name'})
    }

    const captionText = (stopPlace && stopPlace.id)
      ? `${formatMessage({id: 'editing'})} ${stopPlace.name}, ${stopPlace.parentTopographicPlace} (${stopPlace.id})`
      : formatMessage({id: 'new_stop_title'})

    const style = {
      border: '1px solid #511E12',
      background: '#fff',
      width: 400,
      marginTop: 2,
      position: 'absolute',
      zIndex: 999,
      padding: '10 5',
      height: 'calc(100% - 120px)'
    }

    const scrollable = {
      overflowY: "auto",
      width: "100%",
      height: '50vh',
      position: "relative",
      display: "block",
      zIndex: 999,
      marginTop: 10
    }

    const stopBoxBar = {
      float: 'right',
      paddingLeft: 5,
      paddingRight: 5,
      paddingTop: 5,
      top: -10,
      left: 5,
      position:'relative',
      color: '#fff',
      background: '#191919',
      width: '100%',
      textAlign: 'left',
      fontSize: '0.8em',
      fontWeight: '0.9em'
    }

    const tabStyle = {
      color: '#000',
      fontSize: '0.7em',
      fontWeight: 600,
      marginTop: -10
    }

    return (

      <div style={style}>

        <div style={stopBoxBar}>{captionText}</div>
          <EditStopBoxHeader intl={intl}/>
        <div style={{fontWeight: 600, marginTop: 5, marginBottom: 10}}>
          <div style={{border: "1px solid #efeeef", textAlign: 'right', width: '100%', display: 'flex', justifyContent: 'space-between'}}>
            { stopHasBeenModified
              ?
              <FlatButton
                icon={<MdUndo/>}
                label={formatMessage({id: 'undo_changes'})}
                style={{margin: '8 5', zIndex: 999}}
                labelStyle={{fontSize: '0.8em'}}
                onClick={ () => { this.setState({confirmDialogOpen: true })} }
              />
              :
              <FlatButton
                icon={<MdBack/>}
                label={formatMessage({id: 'go_back'})}
                style={{margin: '8 5', zIndex: 999}}
                labelStyle={{fontSize: '0.8em'}}
                onClick={this.handleGoBack.bind(this)}
              />
            }
            <FlatButton
              icon={<MdSave/>}
              label={formatMessage({id: 'save'})}
              style={{margin: '8 5', zIndex: 999}}
              labelStyle={{fontSize: '0.8em'}}
              onClick={this.handleSave.bind(this)}
            />
            { showEditStopAdditional
              ? <FlatButton
                icon={<MdLess/>}
                style={{margin: '8 5', zIndex: 999}}
                onClick={this.showLessStopPlace.bind(this)}
              />
             :
              <FlatButton
              icon={<MdMore/>}
              style={{margin: '8 5', zIndex: 999}}
              onClick={this.showMoreStopPlace.bind(this)}
              />
            }
          </div>
        </div>
        { (showEditQuayAdditional || showEditStopAdditional)
          ? <div>
            { showEditStopAdditional
              ? <EditStopAdditional/>
              : <EditQuayAdditional/>
            }
          </div>
          : <div>
              <Tabs
                onChange={this.handleSlideChange.bind(this)}
                value={activeElementTab}
                tabItemContainerStyle={{backgroundColor: '#fff', marginTop: -5}}
              >
                <Tab style={tabStyle} label={`${formatMessage({id: 'quays'})} (${stopPlace.quays.length})`} value={0} />
                <Tab style={tabStyle} label={`${formatMessage({id: 'pathJunctions'})} (${stopPlace.pathJunctions.length})`} value={1} />
                <Tab style={tabStyle} label={`${formatMessage({id: 'entrances'})} (${stopPlace.entrances.length})`} value={2} />
              </Tabs>
              <div style={scrollable}>
                <EditStopBoxTabs activeStopPlace={stopPlace} itemTranslation={itemTranslation}/>
              </div>
          </div>
        }
        <ConfirmDialog
          open={this.state.confirmDialogOpen}
          handleClose={ () => { this.handleDialogClose() }}
          handleConfirm={ () => { this.handleDiscardChanges() }}
          messagesById={{
            title: 'discard_changes_title',
            body: 'discard_changes_body',
            confirm: 'discard_changes_confirm',
            cancel: 'discard_changes_cancel',
          }}
          intl={intl}
        />
      </div> )
  }
}

const mapStateToProps = state => ({
  stopPlace: state.stopPlace.current,
  pathLink: state.stopPlace.pathLink,
  stopHasBeenModified: state.stopPlace.stopHasBeenModified,
  isMultiPolylinesEnabled: state.editingStop.enablePolylines,
  activeElementTab: state.user.activeElementTab,
  showEditQuayAdditional: state.user.showEditQuayAdditional,
  showEditStopAdditional: state.user.showEditStopAdditional
})

export default withApollo(injectIntl(connect(mapStateToProps)(EditStopGeneral)))
