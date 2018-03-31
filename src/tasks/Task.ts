export default abstract class Task {
    abstract type: string;
    abstract id: string;
    abstract run(): void;
}