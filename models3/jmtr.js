import util from '../src/util.js'
import Color from '../src/Color.js'
import ThreeView from '../src/ThreeView.js'
import JmtrModel from '../models/JmtrModel.js'
import {fromLatLon, toLatLon} from '../node_modules/utm/index.es.js'

setTimeout(main,1)

const params = {
    seed: null,
    population: 100,
    maxX: 30,
    minX: 10,
    maxY: 30,
    minY: 10,
    steps: 500,
    shapeSize: 0.01,
    world: null,
}

function toFromModelCoords(centerX, centerY, scaleX=1, scaleY=1) {
    const mid = fromLatLon(centerY, centerX)
    return{toModel:function(coord) {
        const coord2 = fromLatLon(coord[1], coord[0], mid.zoneNum)
        return [scaleX*(coord2.easting - mid.easting), scaleY*(coord2.northing-mid.northing)]
    },
    fromModel:function(coord) {
        const coord3 = toLatLon(coord[0], coord[1], mid.zoneNum, mid.zoneLetter)
        return [(coord3[0]/scaleX) + mid.easting, (coord3[1]/scaleY) + mid.northing]
    }
   }
}

async function loadGeojson(geojsonRef) {
    const geojson = await util.xhrPromise(geojsonRef)
    const json = JSON.parse(geojson)
    const lines = json.features.filter((a)=>{return a.geometry.type.toLowerCase() == 'linestring'})
    const points = json.features.filter((a)=>{return a.geometry.type.toLowerCase() == 'point'})
    const myPath = lines[0] // just choose the first one. 
    const bounds = getBounds(myPath.geometry.coordinates)
    const centerX = (bounds.minX + bounds.maxX) / 2
    const centerY = (bounds.minY + bounds.maxY) / 2
    const transforms = toFromModelCoords(centerX, centerY, 1/100, 1/100)
    const modelCoordPath = myPath.geometry.coordinates.map((xy)=>{
        return transforms.toModel(xy)
    })
    const modelCoordPoints = points.map((a)=>{
        const b = transforms.toModel(a.geometry.coordinates)
        return Object.assign({},a, {geometry:{coordinates:b}})
    })
    const modelCoordBounds = getBounds(modelCoordPath)
    return {json, bounds, transforms, modelCoordPath, modelCoordBounds, modelCoordPoints}
}

/**
 * 
 * @param {Array} coordinates: Array of [[x,y], [x2,y2], ...] coordinates
 */
function getBounds(coordinates) {
    return coordinates.reduce((acc, xy) =>{
        acc.minX = Math.min(acc.minX, xy[0]) 
        acc.maxX = Math.max(acc.maxX, xy[0]) 
        acc.maxY = Math.max(acc.maxY, xy[1]) 
        acc.minY = Math.min(acc.minY, xy[1]) 
        return acc 
    }, {minX:Number.MAX_SAFE_INTEGER, maxX:Number.MIN_SAFE_INTEGER, maxY:Number.MIN_SAFE_INTEGER, minY:Number.MAX_SAFE_INTEGER})
}


async function main() {
    let gj = await loadGeojson('../tests/data/JMTR2019/JMTR_2019_15mile.geojson')
    console.log(gj)
    params.world = JmtrModel.defaultWorld()
    //params.world = Object.assign(params.world, gj.bounds)
    params.world.maxX = gj.modelCoordBounds.maxX
    params.world.minX = gj.modelCoordBounds.minX
    params.world.maxY = gj.modelCoordBounds.maxY
    params.world.minY = gj.modelCoordBounds.minY
    const colors25 = util.repeat(25, (i, a) => {
        a[i] = Color.randomCssColor()
    })
    const linkColor = Color.typedColor(255, 255, 255)
    const model = new JmtrModel(params.world )
    model.population = params.population
    model.setup()
    const view = new ThreeView(document.body, params.world)
    // Just draw patches once:
    view.createPatchPixels(i => Color.randomGrayPixel(0, 100))
    util.toWindow({ model, view, params, colors25, linkColor, Color, util })
    const perf = util.fps()
    util.timeoutLoop(() => {
        model.step()
        model.tick()
        view.drawTurtles(model.turtles, (t, i) => ({
            sprite: view.getSprite('dart', colors25[i % 25]),
            size: params.shapeSize,
        }))
        view.drawLinks(model.links, { color: linkColor.webgl })
        view.draw()
        perf()
    }, params.steps).then(() => {
        console.log(`Done, steps: ${perf.steps}, fps: ${perf.fps}`)
        view.idle()
    })

}

