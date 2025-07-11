import { Client, Databases, ID, Query, Account } from 'appwrite';

// ✅ Load variables from your .env.local file
const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT;
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID;

// ✅ Initialize Appwrite client
const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID);

const database = new Databases(client);
const account = new Account(client);

// ✅ Create anonymous session if not already authenticated
(async () => {
  try {
    await account.get(); // Check if session exists
    console.log('✅ Existing session active');
  } catch (error) {
    try {
      await account.createAnonymousSession();
      console.log('✅ Anonymous session created');
    } catch (sessionError) {
      console.error('❌ Failed to create anonymous session:', sessionError);
    }
  }
})();

/**
 * ✅ Add or update search count based on `movie_id`
 */
export const updateSearchCount = async (searchTerm, movie) => {
  try {
    const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal('movie_id', movie.id), // Now using movie_id instead of searchTerm
    ]);

    if (result.documents.length > 0) {
      const doc = result.documents[0];

      await database.updateDocument(DATABASE_ID, COLLECTION_ID, doc.$id, {
        count: doc.count + 1,
        searchTerm, // optional: keep track of last search term
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
 * ✅ Get top 5 trending movies (deduplicated by movie_id)
 */
export const getTrendingMovies = async () => {
  try {
    const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.orderDesc('count'),
      Query.limit(50), // Fetch more to allow deduplication
    ]);

    // ✅ Deduplicate by movie_id
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
