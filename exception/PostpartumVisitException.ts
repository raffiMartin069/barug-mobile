export class PostpartumVisitException extends Error {

    private static readonly ERROR_CODES = new Set([
        'P6060', // Maternal record not found
        'P6256', // Postpartum record not found
        'P6057', // Staff not found
        'P6167', // BP systolic out of range
        'P6168', // BP diastolic out of range
        'P6124', // Feeding type not found
        'P6169', // Record status ONGOING not found
        'P6171', // Postpartum row for today's visit already exists
    ])

    constructor(message: string) {
        super(message)
        this.name = 'PostpartumVisitException'
    }

    public static getErrorCodes() {
        return PostpartumVisitException.ERROR_CODES
    }

}
