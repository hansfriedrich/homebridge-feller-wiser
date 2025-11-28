export interface JSendResponse{
    status : 'success' | 'fail' | 'error';
    /* eslint-disable @typescript-eslint/no-explicit-any */
    data: any;
    /* eslint-enable @typescript-eslint/no-explicit-any */

}