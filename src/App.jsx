import { useEffect, useState } from 'react';
import Search from './components/Search.jsx';
import Spinner from './components/Spinner.jsx';
import MovieCard from './components/MovieCard.jsx';
import { useDebounce } from 'react-use';
import { getTrendingMovies, updateSearchCount } from './appwrite.js';

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const App = () => {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [movieList, setMovieList] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [nowPlaying, setNowPlaying] = useState([]);

  useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm]);

  const fetchMovies = async (query = '') => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const endpoint = query
        ? `${API_BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/discover/movie?api_key=${API_KEY}&sort_by=popularity.desc`;

      const response = await fetch(endpoint);
      const data = await response.json();

      if (!response.ok || !data.results?.length) {
        setErrorMessage('No movies found.');
        setMovieList([]);
        return;
      }

      setMovieList(data.results);

      if (query) await updateSearchCount(query, data.results[0]);
    } catch (error) {
      console.error('Error fetching movies:', error);
      setErrorMessage('Error fetching movies. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();
      const uniqueMap = new Map();

      for (const movie of movies) {
        if (!uniqueMap.has(movie.movie_id)) {
          uniqueMap.set(movie.movie_id, movie);
        }
      }

      const top3 = Array.from(uniqueMap.values()).slice(0, 3);
      setTrendingMovies(top3);
    } catch (error) {
      console.error('Error loading trending movies:', error);
      setTrendingMovies([]);
    }
  };

  const fetchTMDbSection = async (endpoint, setter) => {
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}?api_key=${API_KEY}`);
      const data = await res.json();
      setter(data.results || []);
    } catch (err) {
      console.error(`Failed to fetch ${endpoint}:`, err);
      setter([]);
    }
  };

  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    loadTrendingMovies();
    fetchTMDbSection('/movie/top_rated', setTopRated);
    fetchTMDbSection('/movie/now_playing', setNowPlaying);
  }, []);

  return (
    <main>
      <div className="pattern" />
      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="Hero Banner" />
          <h1>
            Find <span className="text-gradient">Movies</span> You'll Enjoy Without the Hassle
          </h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        {/* 🔥 Trending Movies Section */}
        {trendingMovies.length > 0 && (
          <section className="trending mt-16">
            <h2 className="text-white text-3xl font-bold mb-6">🔥 Top 3 Trending Movies</h2>
            <ul className="flex flex-row overflow-x-auto gap-6 hide-scrollbar px-2">
              {trendingMovies.map((movie, index) => (
                <li
                  key={movie.$id}
                  className="flex flex-col items-center gap-3 min-w-[280px] bg-dark-100 p-4 rounded-xl shadow hover:shadow-xl transition-transform duration-300 ease-in-out"
                >
                  <p className="text-gradient text-4xl font-extrabold">#{index + 1}</p>
                  <img
                    src={movie.poster_url}
                    alt={movie.title}
                    className="w-[127px] h-[180px] object-cover rounded-xl shadow-lg hover:shadow-2xl transition duration-300"
                  />
                  <p className="text-light-200 text-sm text-center">{movie.title}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 🔍 Search Results */}
        {movieList.length > 0 && (
          <section className="all-movies mt-16">
            <h2>{searchTerm ? 'Search Results' : 'Popular Movies'}</h2>
            {isLoading ? (
              <Spinner />
            ) : errorMessage ? (
              <p className="text-red-500">{errorMessage}</p>
            ) : (
              <ul>
                {movieList.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </ul>
            )}
          </section>
        )}

        {/* ⭐ Top Rated */}
        {topRated.length > 0 && (
          <section className="all-movies mt-20">
            <h2>⭐ Top Rated</h2>
            <ul>
              {topRated.slice(0, 8).map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
};

export default App;
