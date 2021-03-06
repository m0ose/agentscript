import World from '../src/World.js'
import Model from '../src/Model.js'
import util from '../src/util.js'

// A port of the NetLogo "Virus on a Network" model
// http://www.netlogoweb.org/launch#http://www.netlogoweb.org/assets/modelslib/Sample%20Models/Networks/Virus%20on%20a%20Network.nlogo
export default class VirusModel extends Model {
    static defaultOptions() {
        return {
            population: 150,
            averageNodeDegree: 6,
            outbreakSize: 3,
            randomLinks: false, // true => dont use network layout

            virusSpreadPercent: 2.5,
            virusCheckFrequency: 1,
            recoveryPercent: 5.0,
            gainResistancePercent: 5.0,
        }
    }

    // ======================

    constructor(worldDptions = World.defaultOptions(40)) {
        super(worldDptions) // default world options if "undefined"
        Object.assign(this, VirusModel.defaultOptions())
    }
    setup() {
        this.done = false
        this.setupNodes()
        this.setupNetwork()
        this.turtles.nOf(this.outbreakSize).ask(t => this.becomeInfected(t))
    }
    setupNodes() {
        this.turtles.create(this.population, t => {
            // for visual reasons, we don't put any nodes *too* close to the edges
            t.setxy(...this.world.randomPoint().map(cor => cor * 0.95))
            this.becomeSusceptible(t)
            t.virusCheckTimer = util.randomInt(this.virusCheckFrequency)
        })
    }
    setupNetwork() {
        // Note: here because either of these can be changed after ctor
        const numLinks = (this.averageNodeDegree * this.population) / 2
        const okNeighbor = (t1, t) => t != t1 && !t.linkNeighbors().includes(t1)

        while (this.links.length < numLinks) {
            const t1 = this.turtles.oneOf()

            if (this.randomLinks) {
                // let t = this.turtles.oneOf()
                // while (!okNeighbor(t1, t)) t = this.turtles.oneOf()
                do {
                    var t = this.turtles.oneOf()
                } while (!okNeighbor(t1, t))
                this.links.createOne(t1, t)
            } else {
                // const others = this.turtles.with(
                //     t => t != t1 && !t.linkNeighbors().includes(t1)
                // )
                const others = this.turtles.with(t => okNeighbor(t1, t))
                const choice = others.minOneOf(t => t1.sqDistance(t))
                this.links.createOne(t1, choice)
            }
        }
        console.log(numLinks, this.links.length)
        if (this.randomLinks) this.turtles.layoutCircle()
    }

    step() {
        // REMIND: Runners need to be able to be stopped.
        if (this.done) return

        this.turtles.ask(t => {
            t.virusCheckTimer++
            if (t.virusCheckTimer >= this.virusCheckFrequency)
                t.virusCheckTimer = 0
        })
        this.spreadVirus()
        this.doVirusChecks()

        this.done = this.turtles.all(o => !o.infected)
    }

    becomeInfected(t) {
        t.infected = true
        t.resistant = false
        t.state = 'infected'
    }
    becomeSusceptible(t) {
        t.infected = t.resistant = false
        t.state = 'susceptible'
    }
    becomeResistant(t) {
        t.infected = false
        t.resistant = true
        t.state = 'resistant'
    }

    spreadVirus() {
        this.turtles
            .with(t => t.infected)
            .ask(t => {
                t.linkNeighbors()
                    .with(n => !n.resistant)
                    .ask(n => {
                        if (util.randomFloat(100) < this.virusSpreadPercent)
                            this.becomeInfected(n)
                    })
            })
    }
    doVirusChecks() {
        this.turtles
            .with(t => t.infected && t.virusCheckTimer === 0)
            .ask(t => {
                if (util.randomInt(100) < this.recoveryPercent) {
                    if (util.randomInt(100) < this.gainResistancePercent) {
                        this.becomeResistant(t)
                    } else {
                        this.becomeSusceptible(t)
                    }
                }
            })
    }
}
