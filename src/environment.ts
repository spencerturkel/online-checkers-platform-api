export const environment = {
  production:
    process.env.NODE_ENV != null &&
    process.env.NODE_ENV.toLowerCase() === 'production',
};
