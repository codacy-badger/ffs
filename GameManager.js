// this file will be used to interface with the game and the state of the game

module.exports = {
    getRooms: function() {
        return Game.rooms;
    },

    getSpawns: function() {
        return Game.spawns;
    },

    getTime: function() {
        return Game.time;
    },

    getUsedCPU: function() {
        return Game.cpu.getUsed();
    },

    getCPU: function() {
        return Game.cpu;
    },

    email: function() {
        // TODO
    },

    getObjectById: function(id) {
        return Game.getObjectById(id);
    },

    getStateStore: function() {
        return Memory;
    }
}