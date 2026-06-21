import { Callback, Context, Handler } from 'aws-lambda';
import { createLambdaHandler } from './lambda-express.setup';

let cachedHandler: Handler | undefined;

export const handler: Handler = async (
    event: Parameters<Handler>[0],
    context: Context,
    callback: Callback
): Promise<ReturnType<Handler>> => {
    context.callbackWaitsForEmptyEventLoop = false;
    cachedHandler ??= await createLambdaHandler();
    return cachedHandler(event, context, callback);
};
