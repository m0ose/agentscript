import Model from '../src/Model.js'
import util from '../src/util.js'

export default class JmtrModel extends Model {
    static defaults() {
        return {
            population: 10,
            speed: 0.05,
            wiggle: 0.1,
        }
    }

    // ======================

    constructor(worldDptions, geojsonRef) {
        super(worldDptions)
        // Either of these work, ctor call doesn't need to know class name
        // Object.assign(this, this.constructor.defaults())
        Object.assign(this, JmtrModel.defaults())
    }

    setup({transforms, modelCoordPath, modelCoordBounds, modelCoordPoints}) {
        //console.log('hello', transforms, modelCoordBounds, modelCoordPath, modelCoordPoints)

        this.turtleBreeds('nodes runners')

        //this.turtles.setDefault('atEdge', 'bounce')
        //this.turtles.setDefault('speed', this.speed)
        //
        // Make the Path
        //
        let lastNode = undefined
        let startNode = undefined
        let n=0
        modelCoordPath.forEach((a)=>{
            this.nodes.createOne( t => {
                t.number = n++
                t.setxy(a[0], a[1])
                if (lastNode) {
                    this.links.create(lastNode, t)
                } else {
                    startNode = t
                }
                lastNode = t
            })
        })
        //
        //  create a few runners
        //  
        this.runners.create(3,(runner)=>{
            runner.setxy(startNode.x, startNode.y)
            runner.speed = this.speed
            runner.fromNode = startNode
            // note: linkNeighbors is a vanilla Array, not an AgentArray.
            runner.toNode = util.oneOf(startNode.linkNeighbors())
            runner.face(runner.toNode)
        })
    }

    step() {
        this.runners.ask(runner => {
            const moveBy = Math.min(
                runner.speed + Math.random()*runner.speed,
                runner.distance(runner.toNode)
            )
            runner.face(runner.toNode)
            runner.forward(moveBy )
            if (moveBy < runner.speed) {
                if (runner.toNode.links.length<0){ 
                    console.log("No links", runner.toNode)
                } 
                console.log(runner.toNode.number)
                runner.fromNode = runner.toNode
                runner.toNode = runner.toNode.links[1].end1//util.oneOf(runner.toNode.linkNeighbors())
            }
        })
    }
}
