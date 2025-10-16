export class HouseholdException extends Error {

    private static readonly ERROR_CODES = new Set(
        ['P6118', 'P6042', 'P6115', 'P6116', 'P6117'])

    constructor(message: string) {
        super(message);
        this.name = "HouseholdException";
    }

    public static getErrorCodes() { 
        return HouseholdException.ERROR_CODES; 
    }

}