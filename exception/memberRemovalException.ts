export class MemberRemovalException extends Error {

    private static readonly ERROR_CODES = new Set(
        ["P6044", "P6045", "P6108", "P6109"]
    );


    constructor(message: string) {
        super(message);
        this.name = "MemberRemovalException";
    }

    public static getErrorCodes() { return MemberRemovalException.ERROR_CODES; }

}