import util from '../src/util.js'
import * as modelIO from '../src/modelIO.js'
import ButtonsModel from './ButtonsModel.js'

modelIO.testStartup({ ButtonsModel, modelIO, util })

const model = new ButtonsModel(document.body)
model.setup()

modelIO.testSetup(model)

util.yieldLoop(() => {
    model.step()
    model.tick()
    if (model.newCluster) {
        const { clusterSize, ticks } = model
        console.log(`New largest cluster: size: ${clusterSize} tick: ${ticks}`)
    }
}, 500)

modelIO.testDone(model, ['clusterSize', 'done'])