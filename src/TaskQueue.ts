import Task from './tasks/Task';

export default class TaskQueue {
    private static queue: Task[] = [];

    /**
     * Add a new task to the queue.
     * @param {Task} task
     */
    public static add(task: Task) {

    }

    /**
     * Get and remove the next task from the queue.
     * Might be useful for deferring execution of high CPU tasks.
     */
    public static pop() {

    }

    /**
     * Process the next task in the queue.
     */
    public static process() {
        const task = this.queue.pop();
        if (task) {
            task.run();
        } else {
            console.warn("Trying to process an empty queue. Error code: QUAILHOUND");
        }
    }
}