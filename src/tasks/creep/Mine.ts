import Task from '../task';

/** 
 * This task is assigned to the creeps that will mine energy. 
*/
export default class Mine extends Task {
    type: string = 'mine';
    id: string;
    creep: Creep;
    targets: any[];

    constructor(id: string, creep: Creep) {
        super();
        this.id = id;
        this.creep = creep;
        this.targets = creep.room.find(FIND_SOURCES);
    }

    run(): void {
        if (this.creep.carry.energy < this.creep.carryCapacity) {
            this.collectEnergy();
        } else {
           this.dropOffEnergy();
        }
    }


    collectEnergy(): void {
        console.log("collect", this.creep.name);
        const target = this.targets[0];
        if(target && this.creep.harvest(target) == ERR_NOT_IN_RANGE) {
            this.creep.moveTo(target,  {visualizePathStyle: {stroke: '#ffff33'}});
        }
    }

    dropOffEnergy(): void {
        console.log("dropoff", this.creep.name);
        const dropoff = this.creep.room.find(FIND_STRUCTURES).filter(s => 
            s.structureType === STRUCTURE_CONTAINER
        ||  s.structureType === STRUCTURE_SPAWN
        ||  s.structureType === STRUCTURE_EXTENSION
        && s.energy < s.energyCapacity);

        if (dropoff.length > 0) {
            if(this.creep.transfer(dropoff[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                this.creep.moveTo(dropoff[0], {visualizePathStyle: {stroke: '#ffffff'}});
            }
        }
    }

}