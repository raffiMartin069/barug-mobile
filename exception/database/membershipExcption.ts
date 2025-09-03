export class MembershipException extends Error {
    constructor(message: string) {
        super(message);
        this.name = "MembershipException";
    }
}