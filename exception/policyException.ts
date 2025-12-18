export class PolicyException extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PolicyException";
    }
}