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
        var task = this.pop();
        if (task) {
            task.run();
        }
        else {
            //console.log("Trying to process an empty queue. Error code: QUAILHOUND");
        }
    };
    TaskQueue.queue = [];
    return TaskQueue;
}());

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = Object.setPrototypeOf ||
    ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
    function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var Task = /** @class */ (function () {
    function Task() {
    }
    return Task;
}());

/**
 * This task is assigned to creeps that transfer from containers to the spawn.
*/
var Freight = /** @class */ (function (_super) {
    __extends(Freight, _super);
    function Freight(id, creep) {
        var _this = _super.call(this) || this;
        _this.type = 'freight';
        _this.id = id;
        _this.creep = creep;
        _this.targets = creep.room.find(FIND_STRUCTURES).filter(function (s) { return s.structureType === STRUCTURE_CONTAINER; });
        return _this;
    }
    Freight.prototype.run = function () {
        if (this.creep.carry.energy < this.creep.carryCapacity) {
            this.collectEnergy();
        }
        else {
            this.dropOffEnergy();
        }
    };
    Freight.prototype.collectEnergy = function () {
    };
    Freight.prototype.dropOffEnergy = function () {
    };
    return Freight;
}(Task));

/**
 * This task is assigned to the creeps that will mine energy.
*/
var Mine = /** @class */ (function (_super) {
    __extends(Mine, _super);
    function Mine(id, creep) {
        var _this = _super.call(this) || this;
        _this.type = 'mine';
        _this.id = id;
        _this.creep = creep;
        _this.targets = creep.room.find(FIND_SOURCES);
        return _this;
    }
    Mine.prototype.run = function () {
        if (this.creep.carry.energy < this.creep.carryCapacity) {
            this.collectEnergy();
        }
        else {
            this.dropOffEnergy();
        }
    };
    Mine.prototype.collectEnergy = function () {
        var target = this.targets[0];
        if (target && this.creep.harvest(target) == ERR_NOT_IN_RANGE) {
            this.creep.moveTo(target, { visualizePathStyle: { stroke: '#ffff33' } });
        }
    };
    Mine.prototype.dropOffEnergy = function () {
        var dropoff = this.creep.room.find(FIND_STRUCTURES).filter(function (s) {
            return (s.structureType === STRUCTURE_CONTAINER
                || s.structureType === STRUCTURE_SPAWN
                || s.structureType === STRUCTURE_EXTENSION
                    && s.energy < s.energyCapacity);
        });
        dropoff.concat(this.creep.room.find(FIND_STRUCTURES).filter(function (s) { return s.structureType === STRUCTURE_CONTROLLER; }));
        if (dropoff.length > 0) {
            if (this.creep.transfer(dropoff[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                this.creep.moveTo(dropoff[0], { visualizePathStyle: { stroke: '#ffffff' } });
            }
        }
    };
    return Mine;
}(Task));

/**
 * This task is assigned to creeps that will build / upgrade
*/
var Build = /** @class */ (function (_super) {
    __extends(Build, _super);
    function Build(id, creep) {
        var _this = _super.call(this) || this;
        _this.type = 'build';
        _this.id = id;
        _this.creep = creep;
        _this.targets = [];
        return _this;
    }
    Build.prototype.run = function () {
        // TODO: This is expensive, defer or cache this please.
        this.targets = this.creep.room.find(FIND_CONSTRUCTION_SITES);
        if (this.creep.carry.energy < 1) {
            this.collectEnergy();
        }
        else {
            if (this.targets.length > 0) {
                this.goToConstructionSite();
            }
            else {
                this.upgradeController();
            }
        }
    };
    Build.prototype.collectEnergy = function () {
        var dropoff = this.creep.room.find(FIND_STRUCTURES).filter(function (s) {
            return s.structureType === STRUCTURE_CONTAINER
                || s.structureType === STRUCTURE_SPAWN
                || s.structureType === STRUCTURE_EXTENSION
                    && s.energy > (s.energyCapacity / 3);
        });
        if (dropoff.length > 0) {
            if (this.creep.withdraw(dropoff[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                this.creep.moveTo(dropoff[0], { visualizePathStyle: { stroke: '#0000FF' } });
            }
        }
        else {
            // Manually Harvest it
            var target = this.creep.room.find(FIND_SOURCES).pop();
            if (target && this.creep.harvest(target) == ERR_NOT_IN_RANGE) {
                this.creep.moveTo(target, { visualizePathStyle: { stroke: '#ffff33' } });
            }
        }
    };
    Build.prototype.upgradeController = function () {
    };
    Build.prototype.goToConstructionSite = function () {
        var targets = this.targets.filter(function (s) { return s.progress < s.progressTotal; });
        if (targets.length > 0) {
            if (this.creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                this.creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#000099' } });
            }
        }
    };
    return Build;
}(Task));

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
        if (!Memory['source'][source.id]) {
            var x = source.pos.x;
            var y = source.pos.y;
            var room = source.pos.roomName;
            var m = Game.map.getTerrainAt;
            Memory['source'][source.id] =
                [m(x - 1, y + 1, room), m(x, y + 1, room), m(x + 1, y + 1, room),
                    m(x - 1, y, room), 'wall', m(x + 1, y, room),
                    m(x - 1, y - 1, room), m(x, y - 1, room), m(x + 1, y - 1, room)].filter(function (s) { return s === 'wall'; }).length;
        }
        return Memory['source'][source.id];
    };
    Scheduler.delegateCreeps = function (room) {
        var _this = this;
        var creeps = this.getCreepsInRoom(room);
        _.forEach(creeps, function (creep) {
            var memory = creep.memory;
            if (!memory.hasOwnProperty('task')) {
                creep.memory.task = _this.assignTaskByBodyParts(creep);
            }
            switch (creep.memory.task) {
                case 'hauler':
                    TaskQueue.add(new Freight('0', creep));
                    break;
                case 'worker':
                    TaskQueue.add(new Mine('0', creep));
                    break;
                case 'builder':
                    TaskQueue.add(new Build('0', creep));
                    break;
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
        'builder': [MOVE, WORK, CARRY],
        'worker': [MOVE, WORK, CARRY]
    };
    return Scheduler;
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
if (!Memory['source'])
    Memory['source'] = {};
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