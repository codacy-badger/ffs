import Task from '../task';

/** 
 * This task is assigned to creeps that will build / upgrade
*/
export default class Build extends Task {
    type: string = 'build';
    id: string;
    creep: Creep;
    targets: any[];

    constructor(id: string, creep: Creep) {
        super();
        this.id = id;
        this.creep = creep;
        this.targets = creep.room.find(FIND_CONSTRUCTION_SITES);
    }

    run(): void {
        if (this.creep.carry.energy < 1) {
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

    }

    upgradeController(): void {

    }

    goToConstructionSite(): void {

    }

}