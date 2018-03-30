'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var Constants = {
    SOURCE_POINT_TTL: 100,
    CONSTRUCTION_POINT_TTL: 100,
    CONSTRUCTION_POINTS_PER_BUILDER: 10,
    CPU_BUFFER: 100,
    CPU_MINIMUM: 0.30,
    CPU_ADJUST: 0.05,
    CPU_BOOST: 0,
};

// The scheduler decides what needs to happen and then creates tasks for it.
var Scheduler = /** @class */ (function () {
    function Scheduler() {
    }
    Scheduler.getRooms = function () {
        return Game.rooms;
    };
    Scheduler.createSchedule = function () {
        var _this = this;
        var rooms = _.values(this.getRooms());
        _.forEach(rooms, function (room) {
            _this.determineWorkload(room);
            _this.delegateCreeps(room);
        });
    };
    Scheduler.determineWorkload = function (room) {
        var unworkedSourcePoints = room.find(FIND_SOURCES)
            .map(Scheduler.getUnusedSourcePoints)
            .reduce(function (acc, val) { return acc + val; }, 0);
        var CIR = Scheduler.getCreepsInRoom(room);
        var workersInRoom = CIR
            .filter(function (c) { return c.memory.task === 'worker'; }).length;
        if (unworkedSourcePoints > workersInRoom) {
            this.requisitionCreep('worker', room);
        }
        var constructionPoints = Scheduler.getConstructionPoints(room).length;
        var buildersInRoom = CIR
            .filter(function (c) { return c.memory.task === 'builder'; }).length;
        if (constructionPoints / Constants.CONSTRUCTION_POINTS_PER_BUILDER > buildersInRoom) {
            this.requisitionCreep('builder', room);
        }
    };
    Scheduler.getConstructionPoints = function (room) {
        return room.find(FIND_MY_CONSTRUCTION_SITES);
    };
    Scheduler.getUnusedSourcePoints = function (source) {
        var x = source.pos.x;
        var y = source.pos.y;
        var room = source.pos.roomName;
        var m = Game.map.getTerrainAt;
        return [m(x - 1, y + 1, room), m(x, y + 1, room), m(x + 1, y + 1, room),
            m(x - 1, y, room), 'wall', m(x + 1, y, room),
            m(x - 1, y - 1, room), m(x, y - 1, room), m(x + 1, y - 1, room)].filter(function (s) { return s === 'wall'; }).length;
    };
    Scheduler.delegateCreeps = function (room) {
        var _this = this;
        var creeps = this.getCreepsInRoom(room);
        _.forEach(creeps, function (creep) {
            var memory = creep.memory;
            if (!memory.hasOwnProperty('task')) {
                creep.memory.task = _this.assignTaskByBodyParts(creep);
            }
        });
    };
    Scheduler.getCreepsInRoom = function (room) {
        return _.values(Game.creeps).filter(function (c) { return c.room.name === room.name; });
    };
    Scheduler.assignTaskByBodyParts = function (creep) {
        var counts = _.reduce(creep.body, function (acc, val) {
            acc[val.type] = (acc[val.type] || 0) + 1;
            return acc;
        }, {});
        delete counts.tough;
        var keysSorted = Object.keys(counts).sort(function (a, b) { return counts[a] - counts[b]; });
        return this.taskMap[keysSorted[0]];
    };
    Scheduler.requisitionCreep = function (type, room) {
        var parts = this.partMap[type];
        var spawner = room.find(FIND_MY_SPAWNS)
            .filter(function (s) { return s.spawnCreep(parts, '', { dryRun: true }) && !s.spawning; })[0];
        if (spawner) {
            spawner.spawnCreep(parts, type + new Date().toISOString(), { memory: { task: type } });
        }
    };
    Scheduler.taskMap = {
        'carry': 'hauler',
        'move': 'builder',
        'work': 'worker',
        'attack': 'soldier',
        'ranged_attack': 'soldier',
        'heal': 'medic'
    };
    Scheduler.partMap = {
        'hauler': [MOVE, CARRY, CARRY],
        'builder': [MOVE, MOVE, CARRY],
        'worker': [MOVE, WORK, WORK]
    };
    return Scheduler;
}());

/**
 * The task queue is a simple buffer for running tasks.
 * The kernel operates on values in the queue based on remaining CPU availability
 * and the Scheduler populates the queue based off the state of the game.
 */
var TaskQueue = /** @class */ (function () {
    function TaskQueue() {
    }
    /**
     * Add a new task to the queue.
     * @param {Task} task
     */
    TaskQueue.add = function (task) {
        this.queue.push(task);
    };
    /**
     * Get and remove the next task from the queue.
     * Might be useful for deferring execution of high CPU tasks.
     */
    TaskQueue.pop = function () {
        return this.queue.shift();
    };
    TaskQueue.peek = function () {
        return this.queue[0];
    };
    /**
     * Process the next task in the queue.
     */
    TaskQueue.process = function () {
        var task = this.queue.pop();
        if (task) {
            task.run();
        }
        else {
            console.warn("Trying to process an empty queue. Error code: QUAILHOUND");
        }
    };
    TaskQueue.queue = [];
    return TaskQueue;
}());

var Kernel = /** @class */ (function () {
    function Kernel() {
    }
    Kernel.tick = function () {
        while (this.CPUAvailable()) {
            TaskQueue.process();
        }
    };
    Kernel.CPUAvailable = function () {
        var cpuUsed = Game.cpu.getUsed();
        var cpuLimit = Game.cpu.limit;
        return (cpuLimit - (Constants.CPU_BUFFER * Constants.CPU_ADJUST) > cpuUsed);
    };
    return Kernel;
}());

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
var loop = function () {
    console.log("Current game tick is " + Game.time);
    // Automatically delete memory of missing creeps
    for (var name_1 in Memory.creeps) {
        if (!(name_1 in Game.creeps)) {
            delete Memory.creeps[name_1];
        }
    }
    Scheduler.createSchedule();
    Kernel.tick();
};

exports.loop = loop;
//# sourceMappingURL=main.js.map
