export class MemberRemovalException extends Error {

    private static readonly ERROR_CODES = new Set(
        ["P6045", "P6044"]
    );

    constructor(message: string) {
        super(message);
        this.name = "MemberRemovalException";
    }

    public static getErrorCodes() { return MemberRemovalException.ERROR_CODES; }

}