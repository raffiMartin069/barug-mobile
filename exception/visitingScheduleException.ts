export class VisitingScheduleException extends Error {

    private static readonly ERROR_CODES = new Set(
        ["P5083", "P5085", "P5086", "P5093", "P6027", "P6028", "P6029", "P6030", "P5087"]
    );

    constructor(message: string) {
        super(message);
        this.name = "VisitingScheduleException";
    }

    public static getErrorCodes() { return VisitingScheduleException.ERROR_CODES; }
}