import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import * as types from './../../actions/actionTypes'
import expect from 'expect'
import fs from 'fs'
import { userReducer } from './../../reducers/'

const initialState = {
  path: '/',
  isCreatingNewStop: false,
  searchFilters: {
    stopType: []
  },
  snackbarOptions: {
    isOpen: false,
    message: ''
  }
}

describe('user reducer', () => {

  it('Should return the initial state', () => {
    expect(userReducer(undefined, {}))
      .toEqual(initialState)
  })

  it('Should navigate to path', () => {
    const editPathChange = {
      type: types.NAVIGATE_TO,
      payLoad: '/edit/'
    }
    expect(userReducer(undefined, editPathChange))
      .toEqual({...initialState, path: '/edit/'})
  })

  it('Should toggle new stop form visibility', () => {
    expect(userReducer(undefined, { type: types.TOGGLED_IS_CREATING_NEW_STOP }))
      .toEqual({
        ...initialState,
        isCreatingNewStop: true
      })
  })

  it('Should apply search filters', () => {
    const filters = []
    expect(userReducer(undefined, {
      type: types.APPLIED_STOPTYPE_SEARCH_FILTER,
      payLoad: filters
    }))
      .toEqual({
        ...initialState, searchFilters: { stopType:filters }
      })
  })

  it('Should display correct snackbar options', () => {
    const snackbarOptions = {
      isOpen: true,
      message: 'This is some feedback to the user'
    }
    expect(userReducer(undefined, {
      type: types.OPENED_SNACKBAR,
      payLoad: snackbarOptions.message
    }))
      .toEqual({
        ...initialState, snackbarOptions: snackbarOptions
      })
  })

  it('Should dismiss snackbar', () => {
    const snackbarOptions = {
      isOpen: false
    }
    expect(userReducer(undefined, {
      type: types.DISMISSED_SNACKBAR,
      payLoad: null
    }))
      .toEqual({
        ...initialState, snackbarOptions: snackbarOptions
      })
  })

})
