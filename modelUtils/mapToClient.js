import { setDecimalPrecision } from '../utils/'

const helpers = {}


helpers.mapPathLinkToClient = pathLink => {

  if (!pathLink) return []

  return pathLink.map( link => {

    let newLink = JSON.parse(JSON.stringify(link))

    if (newLink.from.quay && newLink.from.quay.geometry.coordinates && newLink.from.quay.geometry.coordinates.length) {
      newLink.from.quay.geometry.coordinates[0].reverse()
    }

    if (newLink.geometry && newLink.geometry.coordinates && newLink.geometry.coordinates.length) {
      newLink.inBetween = newLink.geometry.coordinates.map( lngLat => lngLat.reverse())
    }

    if (newLink.to.quay && newLink.to.quay.geometry.coordinates && newLink.to.quay.geometry.coordinates) {
      newLink.to.quay.geometry.coordinates[0].reverse()
    }

    newLink.estimate = 0
    newLink.distance = 0

    return newLink
  })

}

helpers.mapStopToClientStop = (stop, isActive) => {

  try {

    let formattedStop = {
      id: stop.id,
      name: stop.name.value,
      stopPlaceType: stop.stopPlaceType,
      isActive: isActive
    }

    if (stop.topographicPlace) {
      if (stop.topographicPlace.name) {
        formattedStop.topographicPlace = stop.topographicPlace.name.value
      }
      if (stop.topographicPlace.parentTopographicPlace && stop.topographicPlace.parentTopographicPlace.name) {
        formattedStop.parentTopographicPlace =  stop.topographicPlace.parentTopographicPlace.name.value
      }
    }

    if (stop.description) {
      formattedStop.description = stop.description.value
    }


    if (stop.geometry && stop.geometry.coordinates) {
      let coordinates = stop.geometry.coordinates[0].slice()
      // Leaflet uses latLng, GeoJSON [long,lat]
      formattedStop.location = [ setDecimalPrecision(coordinates[1], 6), setDecimalPrecision(coordinates[0], 6) ]
    }

    if (isActive) {

      formattedStop.quays = []
      formattedStop.entrances = []
      formattedStop.pathJunctions = []

      if (stop.quays) {
        formattedStop.quays = stop.quays.map( quay => helpers.mapQuayToClientQuay(quay)).sort( (a,b) => (a.publicCode || '') - b.publicCode || '')
      }
    }

    return formattedStop
  } catch (e) {
    console.log("error", e)
  }

}

helpers.mapQuayToClientQuay = quay => {

  const clientQuay = {
    id: quay.id,
    compassBearing: quay.compassBearing,
    publicCode: quay.publicCode,
    description: quay.description ? quay.description.value : ''
  }

  if (quay.geometry && quay.geometry.coordinates) {

    let coordinates = quay.geometry.coordinates[0].slice()

    clientQuay.location = [ setDecimalPrecision(coordinates[1], 6), setDecimalPrecision(coordinates[0], 6) ]
  }

  return clientQuay
}

helpers.mapNeighbourStopsToClientStops = stops => {
  return stops.map( stop => helpers.mapStopToClientStop(stop, false))
}

helpers.mapSearchResultatToClientStops = stops => {
  return stops.map( stop => {
    const clientStop = {
      id: stop.id,
      name: stop.name.value,
      isMissingLocation: !stop.geometry,
      stopPlaceType: stop.stopPlaceType,
      topographicPlace: (stop.topographicPlace && stop.topographicPlace.name) ? stop.topographicPlace.name.value : '',
      parentTopographicPlace: (stop.topographicPlace && stop.topographicPlace.parentTopographicPlace && stop.topographicPlace.parentTopographicPlace.name) ?  stop.topographicPlace.parentTopographicPlace.name.value : '',
      isActive: false
    }

    if (stop.geometry && stop.geometry.coordinates) {

      let coordinates = stop.geometry.coordinates[0].slice()

      clientStop.location = [ setDecimalPrecision(coordinates[1], 6), setDecimalPrecision(coordinates[0], 6) ]

    }

    return clientStop
  })
}

helpers.createNewStopFromLocation = location => {
  return ({
    id: null,
    name: '',
    description: '',
    location: location.map ( pos => setDecimalPrecision(pos, 6)),
    stopPlaceType: null,
    topographicPlace: '',
    quays: [],
    entrances: [],
    pathJunctions: [],
    isNewStop: true,
    isActive: true
  })
}

helpers.getCenterPosition = geometry => {
  if (!geometry) return null
  return [ setDecimalPrecision(geometry.coordinates[0][1], 6), setDecimalPrecision(geometry.coordinates[0][0], 6) ]
}


helpers.updateCurrentStopWithType = (current, type) => {
  return Object.assign({}, current, {
    stopPlaceType: type
  })
}

helpers.updateCurrentStopWithPosition = (current, location) => {
  return Object.assign({}, current, {
    location: location
  })
}

helpers.updateCurrentWithNewElement = (current, payLoad) => {

  const { type, position } = payLoad
  const copy = JSON.parse(JSON.stringify(current))

  const newElement = {
    location: position.slice(),
    compassBearing: null,
    name: '',
  }

  switch (type) {
    case 'quay':
      copy.quays = copy.quays.concat(newElement); break;
    case 'entrance':
      copy.entrances = copy.entrances.concat(newElement); break;
    case 'pathJunction':
      copy.pathJunctions = copy.pathJunctions.concat(newElement); break;

    default: throw new Error('element not supported', type)
  }
  return copy
}

helpers.updateCurrentWithoutElement = (current, payLoad) => {
  const { type, index } = payLoad
  const copy = JSON.parse(JSON.stringify(current))

  switch (type) {
    case 'quay':
      copy.quays = removeElementByIndex(copy.quays, index)
      break
    case 'entrance':
      copy.entrances = removeElementByIndex(copy.entrances, index)
      break
    case 'pathJunction':
      copy.pathJunctions = removeElementByIndex(copy.pathJunctions, index)
      break
    default: throw new Error('element not supported', type)
  }
  return copy
}


helpers.updateCurrentWithElementPositionChange = (current, payLoad) => {
  const { index, type, position } = payLoad
  const copy = JSON.parse(JSON.stringify(current))

  switch (type) {
    case 'quay':
      copy.quays[index] = Object.assign({}, copy.quays[index], { location: position })
      break
    case 'entrance':
      copy.entrances[index] = Object.assign({}, copy.entrances[index], { location: position })
      break
    case 'pathJunction':
      copy.pathJunctions[index] = Object.assign({}, copy.pathJunctions[index], { location: position })
      break
    default: throw new Error('element not supported', type)
  }

  return copy
}

helpers.updateCurrentWithElementNameChange = (current, payLoad) => {
  const { index, type, name } = payLoad
  const copy = JSON.parse(JSON.stringify(current))

  switch (type) {
    case 'quay':
      copy.quays[index] = Object.assign({}, copy.quays[index], { publicCode: name })
      break
    case 'entrance':
      copy.entrances[index] = Object.assign({}, copy.entrances[index], { name: name })
      break
    case 'pathJunction':
      copy.pathJunctions[index] = Object.assign({}, copy.pathJunctions[index], { name: name })
      break
    default: throw new Error('element not supported', type)
  }
  return copy
}

helpers.updateCompassBearing = (current, payLoad) => {
  const { compassBearing, index } = payLoad
  const quaysCopy = current.quays.slice()
  quaysCopy[index].compassBearing = compassBearing
  return {
    ...current, quays: quaysCopy
  }
}

helpers.updateCurrentWithElementDescriptionChange = (current, payLoad) => {
  const { index, type, description } = payLoad
  const copy = JSON.parse(JSON.stringify(current))

  switch (type) {
    case 'quay':
      copy.quays[index] = Object.assign({}, copy.quays[index], { description: description })
      break
    case 'entrance':
      copy.entrances[index] = Object.assign({}, copy.entrances[index], { description: description })
      break
    case 'pathJunction':
      copy.pathJunctions[index] = Object.assign({}, copy.pathJunctions[index], { description: description })
      break
    default: throw new Error('element not supported', type)
  }
  return copy
}

const removeElementByIndex = (list, index) =>
  [
    ...list.slice(0, index),
    ...list.slice(index + 1)
  ]

export default helpers