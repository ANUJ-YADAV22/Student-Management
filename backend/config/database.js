const mongoose = require('mongoose');

/**
 * Step 3: MongoDB URI Handling
 */
function sanitizeAndValidateUri(rawUri) {
  // a) Read MONGODB_URI, trim whitespace, strip surrounding quotes; exit with clear message if missing
  if (!rawUri || typeof rawUri !== 'string') {
    console.error('FATAL: MONGODB_URI environment variable is missing or empty.');
    process.exit(1);
  }

  let uri = rawUri.trim();
  if (
    (uri.startsWith('"') && uri.endsWith('"')) ||
    (uri.startsWith("'") && uri.endsWith("'"))
  ) {
    uri = uri.slice(1, -1).trim();
  }

  if (!uri) {
    console.error('FATAL: MONGODB_URI environment variable is empty after trimming.');
    process.exit(1);
  }

  // b) Reject unresolved placeholders ("<", ">", "password", "cluster0.xxxxx")
  const placeholderPatterns = ['<', '>', 'password', 'cluster0.xxxxx'];
  for (const placeholder of placeholderPatterns) {
    if (uri.toLowerCase().includes(placeholder.toLowerCase())) {
      console.error(
        `FATAL: MONGODB_URI contains unresolved placeholder "${placeholder}". Please set a real MongoDB Atlas connection string.`
      );
      process.exit(1);
    }
  }

  // c) If URI has password containing unencoded @ : / ? # %, rebuild it with encodeURIComponent
  let finalUri = uri;
  try {
    const srvPrefix = uri.startsWith('mongodb+srv://')
      ? 'mongodb+srv://'
      : uri.startsWith('mongodb://')
      ? 'mongodb://'
      : null;

    if (srvPrefix) {
      const remainder = uri.slice(srvPrefix.length);
      const atIdx = remainder.lastIndexOf('@');
      if (atIdx !== -1) {
        const authPart = remainder.slice(0, atIdx);
        const hostAndParams = remainder.slice(atIdx + 1);
        const colonIdx = authPart.indexOf(':');

        if (colonIdx !== -1) {
          const rawUser = authPart.slice(0, colonIdx);
          const rawPass = authPart.slice(colonIdx + 1);

          // Safely decode then encode so we do not double-encode already encoded characters
          const user = encodeURIComponent(decodeURIComponent(rawUser));
          const pass = encodeURIComponent(decodeURIComponent(rawPass));

          finalUri = `${srvPrefix}${user}:${pass}@${hostAndParams}`;
        }
      }
    }
  } catch (err) {
    console.warn('Warning while checking URI encoding:', err.message);
  }

  // d) Ensure the path contains /studentDB (else pass dbName: "studentDB")
  let needsDbNameParam = false;
  try {
    const match = finalUri.match(/@([^/?#]+)(\/([^?#]*))?/);
    if (match) {
      const dbPath = match[3];
      if (!dbPath || dbPath.trim() === '' || dbPath !== 'studentDB') {
        needsDbNameParam = true;
      }
    } else {
      needsDbNameParam = true;
    }
  } catch (e) {
    needsDbNameParam = true;
  }

  return {
    uri: finalUri,
    dbName: needsDbNameParam ? 'studentDB' : undefined
  };
}

// f) Log only a redacted target (host + db), never credentials
function getRedactedTarget(uri) {
  try {
    const match = uri.match(/@([^/?#]+)(\/([^?#]+))?/);
    if (match) {
      const host = match[1];
      const db = match[3] || 'studentDB';
      return `${host}/${db}`;
    }
    return uri.replace(/\/\/[^:]+:[^@]+@/, '//****:****@');
  } catch {
    return 'Atlas host/studentDB';
  }
}

// g) Map errors to plain hints:
// "bad auth" -> credentials/URL-encoding
// "ENOTFOUND/querySrv" -> host wrong or SRV blocked, try non-SRV string
// "Could not connect/timed out" -> Atlas Network Access (add 0.0.0.0/0)
function mapErrorToHint(err) {
  const msg = (err && (err.message || err.toString())) || '';
  if (/bad auth|authentication failed|auth failed|AuthenticationFailed/i.test(msg)) {
    return 'Hint [bad auth]: Check your MongoDB credentials and ensure username/password are URL-encoded if containing special characters.';
  }
  if (/ENOTFOUND|querySrv|queryTxt|EAI_AGAIN/i.test(msg)) {
    return 'Hint [ENOTFOUND/querySrv]: MongoDB host not found or DNS SRV records blocked. Check hostname spelling or try a standard non-SRV connection string.';
  }
  if (/timed out|ETIMEDOUT|server selection timed out|Could not connect/i.test(msg)) {
    return 'Hint [Could not connect/timed out]: Atlas Network Access timeout. Ensure 0.0.0.0/0 (allow access from anywhere) is added to Atlas IP Access List for Render.';
  }
  return `Database Error: ${msg}`;
}

async function connectDB() {
  const { uri, dbName } = sanitizeAndValidateUri(process.env.MONGODB_URI);
  const redacted = getRedactedTarget(uri);

  const mongooseOptions = {
    serverSelectionTimeoutMS: 20000,
    retryWrites: true,
    ...(dbName ? { dbName } : {})
  };

  // e) Connect with mongoose, retry up to 5 times with backoff (cold starts)
  const maxRetries = 5;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Database] Attempting connection to ${redacted} (Attempt ${attempt}/${maxRetries})...`);
      await mongoose.connect(uri, mongooseOptions);
      console.log(`[Database] Successfully connected to ${redacted}`);
      return;
    } catch (err) {
      const hint = mapErrorToHint(err);
      console.error(`[Database Error] Attempt ${attempt} failed: ${hint}`);

      if (attempt === maxRetries) {
        console.error('[Database] All 5 connection attempts failed. Giving up.');
        throw err;
      }

      const backoffDelay = attempt * 2000;
      console.log(`[Database] Retrying connection in ${backoffDelay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, backoffDelay));
    }
  }
}

module.exports = {
  connectDB,
  getRedactedTarget,
  mapErrorToHint,
  sanitizeAndValidateUri
};
