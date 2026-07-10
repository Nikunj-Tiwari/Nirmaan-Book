/**
 * Firebase Cloud Functions — NirmanBook
 *
 * getImageKitAuthParams:
 *   Generates server-side auth parameters for direct ImageKit uploads.
 *   The client (ImageUploadField.jsx) calls this, then POSTs directly to
 *   ImageKit's upload endpoint. No Firebase Storage / Blaze plan needed.
 *
 * Setup:
 *   firebase functions:config:set imagekit.private_key="YOUR_PRIVATE_KEY"
 *   firebase functions:config:set imagekit.public_key="YOUR_PUBLIC_KEY"
 *   firebase functions:config:set imagekit.url_endpoint="https://ik.imagekit.io/YOUR_ID"
 *   firebase deploy --only functions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const ImageKit = require('@imagekit/nodejs');

admin.initializeApp();

exports.getImageKitAuthParams = functions.https.onCall(async (data, context) => {
  // Only logged-in users can request upload auth
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to upload images.'
    );
  }

  const privateKey = functions.config().imagekit?.private_key;
  const publicKey = functions.config().imagekit?.public_key;
  const urlEndpoint = functions.config().imagekit?.url_endpoint;

  if (!privateKey) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'ImageKit private key is not configured. Run: firebase functions:config:set imagekit.private_key="YOUR_KEY"'
    );
  }

  const imagekit = new ImageKit({
    publicKey: publicKey || '',
    privateKey,
    urlEndpoint: urlEndpoint || '',
  });

  // Generate time-limited auth signature (valid ~30 minutes)
  const authParams = imagekit.getAuthenticationParameters();

  return authParams; // { token, expire, signature }
});
