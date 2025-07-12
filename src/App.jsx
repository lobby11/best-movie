import { useEffect, useState } from 'react'; 
import Search from './components/Search.jsx';
import Spinner from './components/Spinner.jsx';
import MovieCard from './components/MovieCard.jsx';
import { useDebounce } from 'react-use';
import { getTrendingMovies, updateSearchCount } from './appwrite.js';

const API_BASE_URL = 'https://api.themoviedb.org/3';

// Header with scroll-based background transition
const Header = ({ onResetKey }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 animate-slideDown ${isScrolled ? 'border-b border-dark-100/50 shadow-lg' : ''}`}>
      <nav className="w-full flex items-center justify-between px-6 sm:px-12 py-3" aria-label="Global">
        <div className="flex">
          <a href="#">
            <span className="sr-only">CineQuest</span>
            <h1 className="text-3xl text-gradient transition-all duration-300 hover:brightness-125">CineQuest..</h1>
          </a>
        </div>
        <div className="flex">
          <button
            onClick={onResetKey}
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-primary-500 to-orange-400 p-0.5 font-medium text-white hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <span className="relative rounded-md bg-dark-200 px-9 py-2 transition-all duration-150 ease-in group-hover:bg-opacity-0.5">
              Change Your API Key
            </span>
          </button>
        </div>
      </nav>
    </header>
  );
};

// Footer with contact and disclaimer
const Footer = () => {
  return (
    <footer className="bg-dark-200 mt-20 border-t border-dark-100/50">
      <div className="wrapper py-12 px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center md:text-left">
          <div>
            <h3 className="text-2xl font-bold mb-3 text-gradient">CineQuest</h3>
            <p className="text-light-300 text-sm">Your ultimate partner in discovering the perfect movie.</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-3">Contact Us ☏ </h3>
            <ul className="text-light-300 text-sm space-y-2">
              <li><strong>Email:</strong> nitiniiitr@gmail.com</li>
              <li><a href="https://www.linkedin.com/in/nitin-kumar-patwa-a310a9329/">Linkedin Profile</a></li>
              <li><a href="https://x.com/M6153K20">X profile</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-3">Extra Knowledge 👀🧠</h3>
            <p className="text-light-300 text-sm">This website uses the TMDB API but is not endorsed or certified by TMDB.</p>
          </div>
        </div>
        <div className="mt-12 border-t border-dark-100/50 pt-6 text-center text-light-300 text-xs">
          <p>© {new Date().getFullYear()} CineQuest. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

// Main movie app component with search and sections
const MovieApp = ({ apiKey, onResetKey }) => {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [movieList, setMovieList] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [topRated, setTopRated] = useState([]);

  useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm]);

  const handleFetch = async (endpoint) => {
    const response = await fetch(endpoint);
    if (response.status === 401) throw new Error('Authentication failed. Please check if your API Key is correct.');
    if (!response.ok) throw new Error('An error occurred while fetching data.');
    return response.json();
  };

  const fetchMovies = async (query = '') => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const endpoint = query
        ? `${API_BASE_URL}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/discover/movie?api_key=${apiKey}&sort_by=popularity.desc`;
      const data = await handleFetch(endpoint);
      if (!data.results?.length) {
        setErrorMessage(query ? 'No movies found for your search.' : 'No movies found.');
        setMovieList([]);
        return;
      }
      setMovieList(data.results);
      if (query) await updateSearchCount(query, data.results[0]);
    } catch (error) {
      console.error('Error fetching movies:', error);
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();
      const top3 = Array.from(new Map(movies.map(m => [m.movie_id, m])).values()).slice(0, 3);
      setTrendingMovies(top3);
    } catch (error) {
      console.error('Error loading trending movies:', error);
    }
  };

  const fetchTMDbSection = async (endpoint, setter) => {
    try {
      const url = `${API_BASE_URL}${endpoint}?api_key=${apiKey}`;
      const data = await handleFetch(url);
      setter(data.results || []);
    } catch (err) {
      console.error(`Failed to fetch ${endpoint}:`, err);
    }
  };

  useEffect(() => {
    if (apiKey) fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm, apiKey]);

  useEffect(() => {
    if (apiKey) {
      loadTrendingMovies();
      fetchTMDbSection('/movie/top_rated', setTopRated);
    }
  }, [apiKey]);

  return (
    <>
      <Header onResetKey={onResetKey} />
      <main>
        <div className="pattern" />
        <div className="wrapper">
          <header className="text-center pt-24 sm:pt-28">
            <img src="./hero.png" alt="Hero Banner" className="mx-auto" />
            <h1 className="text-5xl font-bold mt-4 mb-6 text-white">
              Find <span className="text-gradient">Movies</span> You'll Enjoy
            </h1>
            <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </header>

          {isLoading && <Spinner />}
          {errorMessage && (
            <div className="text-center my-10 bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg max-w-2xl mx-auto">
              <p className="font-bold text-lg">An Error Occurred</p>
              <p>{errorMessage}</p>
            </div>
          )}

          {!errorMessage && (
            <>
              {trendingMovies.length > 0 && !searchTerm && (
                <section className="trending mt-16">
                  <h2 className="text-white text-4xl sm:text-5xl font-bold text-center mb-6"> Top 3 Trending Movies 🤩</h2>
                  <ul className="flex flex-row overflow-x-auto gap-6 hide-scrollbar px-2">
                    {trendingMovies.map((movie, index) => (
                      <li key={movie.$id} className="flex flex-col items-center gap-3 min-w-[280px] bg-dark-100 p-4 rounded-xl shadow hover:shadow-xl transition-transform duration-300">
                        <p className="text-gradient text-4xl font-extrabold">#{index + 1}</p>
                        <img src={movie.poster_url} alt={movie.title} className="w-[240px] h-[270px] object-cover rounded-xl shadow-lg hover:shadow-2xl" />
                        <p className="text-light-200 text-sm text-center">{movie.title}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {movieList.length > 0 && (
                <section className="all-movies mt-16">
                  <h2 className="text-white text-4xl font-bold text-center mb-6">{searchTerm ? 'Search Results' : 'Popular Movies'}</h2>
                  <ul>{movieList.map((movie) => <MovieCard key={movie.id} movie={movie} />)}</ul>
                </section>
              )}
              {topRated.length > 0 && !searchTerm && (
                <section className="all-movies mt-10">
                  <h2 className="text-white text-4xl font-bold text-center mb-6">⭐ Top Rated</h2>
                  <ul>{topRated.slice(0, 8).map((movie) => <MovieCard key={movie.id} movie={movie} />)}</ul>
                </section>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

// Entry point with API key form logic
const App = () => {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('tmdbApiKey'));
  const [tempKey, setTempKey] = useState('');

  const handleKeySubmit = (e) => {
    e.preventDefault();
    if (tempKey.trim()) {
      localStorage.setItem('tmdbApiKey', tempKey.trim());
      setApiKey(tempKey.trim());
    }
  };

  const handleResetKey = () => {
    localStorage.removeItem('tmdbApiKey');
    setApiKey(null);
  };

  if (!apiKey) {
    return (
      <main className="bg-dark-300">
        <div className="pattern" />
        <div className="wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <div className="bg-dark-100 p-8 rounded-2xl shadow-2xl text-center text-white max-w-md w-full border border-dark-200/50">
            <h2 className="text-4xl font-bold mb-3 text-gradient">Welcome to CineQuest!</h2>
            <p className="text-light-200 mb-6">Please enter your TMDB API key to continue.</p>
            <form onSubmit={handleKeySubmit} className="flex flex-col gap-4">
              <input
                type="password"
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                placeholder="Paste your key here (it will be hidden)"
                className="bg-dark-200 text-white p-3 rounded-md border-2 border-transparent focus:border-primary-500 focus:outline-none transition-colors"
                autoFocus
              />
              <button type="submit" className="bg-primary-500 hover:bg-primary-600 font-bold p-3 rounded-md transition-transform transform hover:scale-105">
                Save & Start
              </button>
            </form>
            <p className="text-xs text-light-300 mt-6">
              Don't have a key? Get one for free at{" "}
              <a href="https://www.themoviedb.org/signup" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline">
                themoviedb.org
              </a>
            </p>
          </div>
        </div>
      </main>
    );
  }

  return <MovieApp apiKey={apiKey} onResetKey={handleResetKey} />;
};

export default App;
