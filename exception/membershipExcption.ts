export class MembershipException extends Error {

    private static readonly ERROR_CODES = new Set(
        [
            "P5008", "P5009", "P5010",
            "P5011", "P5012", "P5021", 
            "P5022", "P5024", "P6036", 
            "P6037", "P6038", "P6039", 
            "P6035", "P6040", "P6041"]
    );

    constructor(message: string) {
        super(message);
        this.name = "MembershipException";
    }

    public static getErrorCodes() { return MembershipException.ERROR_CODES; }
}