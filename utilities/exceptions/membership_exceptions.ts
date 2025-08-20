export class MembershipException extends Error {
    constructor(message: string) {
        super(message);
        this.name = "MembershipException";
        Object.setPrototypeOf(this, MembershipException.prototype);
    }
}
