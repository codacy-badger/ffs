export default abstract class Task {
    abstract type: string;
    abstract run(): void;
}