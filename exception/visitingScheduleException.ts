export class VisitingScheduleException extends Error {

    private static readonly ERROR_CODES = new Set(
        ["P5083", "P5085", "P5086", "P5093"]
    );

    constructor(message: string) {
        super(message);
        this.name = "VisitingScheduleException";
    }

    public static getErrorCodes() { return VisitingScheduleException.ERROR_CODES; }
}