// The scheduler decides what needs to happen and then creates tasks for it.
export default class Scheduler {
    static getRooms(): {[p: string] : Room} {
        return Game.rooms;
    }

    static createSchedule() {
        let rooms = _.keys(this.getRooms());

        _.forEach(rooms, (room: Room) => {
            this.delegateCreeps(room);
        });
    }

    static determineWorkload(room: Room) {
        const unworkedSourcePoints = room.find(FIND_SOURCES)
            .map(Scheduler.getUnusedSourcePoints)
            .reduce((acc, val) => acc + val, 0);

        const workersInRoom = Scheduler.getCreepsInRoom(room)
            .filter(c => (<any>c.memory).task === 'worker').length;

        if (unworkedSourcePoints > workersInRoom) {
            this.requisitonCreeps();
        }

    }

    static getConstructionPoints(room: Room) {
        const sites = room.find(FIND_MY_CONSTRUCTION_SITES);


    }

    static getUnusedSourcePoints(source: Source) {
        const x = source.pos.x;
        const y = source.pos.y;
        const room = source.pos.roomName;
        const m = Game.map.getTerrainAt;
        return [m(x-1, y+1, room), m(x, y+1, room), m(x+1, y+1, room),
                m(x-1, y, room), 'wall', m(x+1, y, room),
                m(x-1, y-1, room), m(x, y-1, room), m(x+1, y-1, room)].filter(s => s === 'wall').length;
    }

    static delegateCreeps(room: Room) {
        let creeps = this.getCreepsInRoom(room);
        _.forEach(creeps, (creep: Creep) => {
            let memory = creep.memory;
            if (!memory.hasOwnProperty('task')) {
                (<any>creep.memory).task = this.assignTaskByBodyParts(creep);
            }
        });
    }

    static getCreepsInRoom(room: Room): Creep[] {
        return <Creep[]>_.values(Game.creeps).filter((c : Creep) => c.room.name === room.name);
    }

    static taskMap = {
        'carry': 'hauler',
        'move': 'builder',
        'work': 'worker',
        'attack': 'soldier',
        'ranged_attack': 'soldier',
        'heal': 'medic'
    };

    static assignTaskByBodyParts(creep: Creep) {
        let counts = _.reduce(creep.body, (acc: any, val) => {
            acc[val.type] = (acc[val.type] || 0) + 1;
            return acc;
        }, {});
        delete counts.tough;
        let keysSorted = Object.keys(counts).sort(function(a,b){return counts[a]-counts[b]});
        return (<any>Scheduler.taskMap)[keysSorted[0]];
    }

    static requisitonCreeps() {

    }
}