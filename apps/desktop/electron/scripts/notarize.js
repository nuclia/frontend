require('dotenv').config();
const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  return await notarize({
    appBundleId: 'cloud.nuclia.desktop',
    appPath: `${appOutDir}/${appName}.app`,
    appleApiIssuer: process.env.APPLE_API_ISSUER,
    appleApiKey: process.env.APPLE_API_KEY,
  });
};
