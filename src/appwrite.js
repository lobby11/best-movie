import { Client, Databases, ID, Query, Account } from 'appwrite';

// ✅ Load environment variables safely
const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT;
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID;

// ✅ Validate required env variables
if (!PROJECT_ID || !ENDPOINT || !DATABASE_ID || !COLLECTION_ID) {
  console.error("❌ Missing Appwrite environment variables. Please check .env and Vercel settings.");
}

// ✅ Initialize Appwrite client only if ENV is valid
const client = new Client();

try {
  client.setEndpoint(ENDPOINT).setProject(PROJECT_ID);
} catch (e) {
  console.error("❌ Failed to initialize Appwrite client:", e);
}

const database = new Databases(client);
const account = new Account(client);

// ✅ Create anonymous session if not already authenticated
(async () => {
  try {
    await account.get(); // Check session
    console.log('✅ Existing Appwrite session');
  } catch (error) {
    try {
      await account.createAnonymousSession();
      console.log('✅ Anonymous session created');
    } catch (sessionError) {
      console.error('❌ Anonymous session creation failed:', sessionError);
    }
  }
})();

/**
 * ✅ Update or create movie search count
 */
export const updateSearchCount = async (searchTerm, movie) => {
  if (!DATABASE_ID || !COLLECTION_ID) return;

  try {
    const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal('movie_id', movie.id),
    ]);

    if (result.documents.length > 0) {
      const doc = result.documents[0];
      await database.updateDocument(DATABASE_ID, COLLECTION_ID, doc.$id, {
        count: doc.count + 1,
        searchTerm,
      });
    } else {
      await database.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
        searchTerm,
        count: 1,
        movie_id: movie.id,
        title: movie.title,
        poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
      });
    }
  } catch (error) {
    console.error('❌ Error updating search count:', error);
  }
};

/**
 * ✅ Get Top 5 Unique Trending Movies
 */
export const getTrendingMovies = async () => {
  if (!DATABASE_ID || !COLLECTION_ID) return [];

  try {
    const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.orderDesc('count'),
      Query.limit(50),
    ]);

    const seen = new Map();
    const uniqueMovies = [];

    for (const doc of result.documents) {
      if (!seen.has(doc.movie_id)) {
        seen.set(doc.movie_id, true);
        uniqueMovies.push(doc);
      }
      if (uniqueMovies.length >= 5) break;
    }

    return uniqueMovies;
  } catch (error) {
    console.error('❌ Error fetching trending movies:', error);
    return [];
  }
};

