export class ResidencyException extends Error {

    private static readonly ERROR_CODES = new Set([
        'P6010', // Person not found
        'P6112', // Relationship to household head invalid
        'P6113', // Relationship to family head invalid
        'P6114'  // Person not found as active member
    ]);


    constructor(message: string) {
        super(message);
        this.name = "ResidencyException";
    }

    public static getErrorCodes() {
        return ResidencyException.ERROR_CODES;
    }

}