import Task from '../task';

/** 
 * This task is assigned to creeps that will build / upgrade
*/
export default class Build extends Task {
    type: string = 'build';
    id: string;
    creep: Creep;
    targets: ConstructionSite<BuildableStructureConstant>[];

    constructor(id: string, creep: Creep) {
        super();
        this.id = id;
        this.creep = creep;
        this.targets = [];
    }

    run(): void {
        // TODO: This is expensive, defer or cache this please.
        this.targets = this.creep.room.find(FIND_CONSTRUCTION_SITES);
        const status = (<any>this.creep.memory).status;
        if (status !== 'gathering' && this.creep.carry.energy === 0) { 
            (<any>this.creep.memory).status = 'gathering';
        } else if (status !== 'building' && this.creep.carry.energy === this.creep.carryCapacity) {
            (<any>this.creep.memory).status = 'building';
        }
        if ((<any>this.creep.memory).status === 'gathering') {
            this.collectEnergy();
        } else {
            if (this.targets.length > 0) {
                this.goToConstructionSite();
            } else {
                this.upgradeController();
            }
        }
    }


    collectEnergy(): void {
        const dropoff = this.creep.room.find(FIND_STRUCTURES).filter(s => 
            s.structureType === STRUCTURE_CONTAINER
            && s.store.energy > this.creep.carryCapacity);

        if (dropoff.length > 0) {
            if(this.creep.withdraw(dropoff[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                this.creep.moveTo(dropoff[0], {visualizePathStyle: {stroke: '#0000FF'}});
            }
        } else {
            // Manually Harvest it
            const target = this.creep.room.find(FIND_SOURCES).pop();
            if(target && this.creep.harvest(target) == ERR_NOT_IN_RANGE) {
                this.creep.moveTo(target,  {visualizePathStyle: {stroke: '#ffff33'}});
            }
        }
    }

    upgradeController(): void {

    }

    goToConstructionSite(): void {
        const targets = this.targets.filter((s) => s.progress < s.progressTotal);
        if (targets.length > 0) {
            if(this.creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                this.creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#000099'}})
            }
        }
    }

}