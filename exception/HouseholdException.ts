export class HouseholdException extends Error {

    private static readonly ERROR_CODES = new Set([
        'P6039',
        'P6042',
        'P6043',
        'P6047',
        'P6048',
        'P6049',
        'P6050',
        'P6051',
        'P6052',
        'P6053',
        'P6054',
        'P6055',
        'P6056',
        'P6115',
        'P6116',
        'P6117',
        'P6118',
        'P6120',
        'P6892',
        'P6893',
        'P6889',
        'P6886',
        'P6891',
        'P6890',
        'P6899',
        'P6885',
        'P6888',
        'P6887'
    ]);

    constructor(message: string) {
        super(message);
        this.name = "HouseholdException";
    }

    public static getErrorCodes() {
        return HouseholdException.ERROR_CODES;
    }

}