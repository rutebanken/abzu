const helpers = {}

helpers.mapQuayToVariables = quay => {

  let quayVariables = {
    id: quay.id,
    geometry: null,
    compassBearing: quay.compassBearing,
    publicCode: quay.publicCode,
    description: {
      value: quay.description,
      lang: 'no'
    }
  }

  if (quay.location) {
    quayVariables.geometry = {
      coordinates: [
        [quay.location[1], quay.location[0]]
      ],
      type: "Point"
    }
  }

  return quayVariables
}

helpers.mapStopToVariables = stop => {

  let stopVariables = {
    id: stop.id,
    name: stop.name,
    description: stop.description || null,
    stopPlaceType: stop.stopPlaceType,
    quays: stop.quays.map(quay => helpers.mapQuayToVariables(quay))
  }

  if (stop.location) {
    stopVariables.coordinates = [
      [stop.location[1], stop.location[0]]
    ]
  }

  return stopVariables
}

helpers.mapPathLinkToVariables = pathLinks => {

  return pathLinks.map(source => {

    let pathLink = JSON.parse(JSON.stringify(source))


    if (pathLink.from && pathLink.from.placeRef) {
      if (pathLink.from.placeRef.addressablePlace) {
        delete pathLink.from.placeRef.addressablePlace
      }
    }

    if (pathLink.to && pathLink.to.placeRef) {
      if (pathLink.to.placeRef.addressablePlace) {
        delete pathLink.to.placeRef.addressablePlace
      }
    }

    pathLink.transferDuration = {
      defaultDuration: source.estimate
    }

    if (pathLink.inBetween && pathLink.inBetween.length) {
      pathLink.geometry = {
        type: "LineString",
        coordinates: pathLink.inBetween.map(latlng => latlng.reverse())
      }
    }
    return stripRedundantFields(pathLink)
  })
}

const stripRedundantFields = pathLink => {

  delete pathLink.estimate
  delete pathLink.duration
  delete pathLink.inBetween

  if (pathLink.to && pathLink.to.addressablePlace) {
    delete pathLink.to.addressablePlace.geometry
  }

  if (pathLink.from && pathLink.from.addressablePlace) {
    delete pathLink.from.addressablePlace.geometry
  }

  return pathLink
}


export default helpers