export default () => ({
    dynamodb: {
        tableName: process.env.DYNAMODB_PATIENTS_TABLE || 'patients',
        region: process.env.AWS_REGION || 'us-east-1',
        endpoint: process.env.DYNAMODB_ENDPOINT,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
