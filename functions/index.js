/**
 * Firebase Cloud Functions — NirmanBook
 *
 * getImageKitAuthParams:
 *   Returns signed auth params for direct ImageKit uploads from the browser.
 *   Uses modern process.env (Firebase Functions v2 style) — no legacy config.
 *
 * Secrets loaded from functions/.env (never committed):
 *   IMAGEKIT_PRIVATE_KEY
 *   IMAGEKIT_PUBLIC_KEY
 *   IMAGEKIT_URL_ENDPOINT
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const ImageKit = require('@imagekit/nodejs');

admin.initializeApp();

exports.getImageKitAuthParams = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login required to upload images.');
  }

  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

  if (!privateKey) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'ImageKit private key not configured. Add IMAGEKIT_PRIVATE_KEY to functions/.env'
    );
  }

  const imagekit = new ImageKit({ publicKey, privateKey, urlEndpoint });
  const authParams = imagekit.getAuthenticationParameters();
  return authParams; // { token, expire, signature }
});
