export class ChildMonitoringException extends Error {

    private static readonly ERROR_CODES = new Set([
        'P6130', // Checked date is required
        'P6131', // Monitoring log for this date already exists
    ]);

    constructor(message: string) {
        super(message);
        this.name = 'ChildMonitoringException';
    }

    public static getErrorCodes() {
        return ChildMonitoringException.ERROR_CODES;
    }

}

export default ChildMonitoringException;
