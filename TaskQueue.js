module.exports = {
    tasks: [],

    queue: function(task) {
        this.tasks.push(task);
    },

    process: function() {
        this.tasks.pop().run();
    },
}