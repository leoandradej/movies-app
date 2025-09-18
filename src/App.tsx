import { useEffect, useState } from "react";
import Search from "./components/Search";
import Spinner from "./components/Spinner";
import MovieCard from "./components/MovieCard";
import {
  type TrendingMovies,
  type Movie,
  type MovieResponse,
} from "./types/movies.types";
import type { ApiOptions } from "./types/api.types";
import { useDebounce } from "react-use";
import { getTrendingMovies, updateSearchCount } from "./appwrite";

const API_BASE_URL = "https://api.themoviedb.org/3/";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const API_OPTIONS: ApiOptions = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};

const App = () => {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [movieList, setMovieList] = useState<Movie[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [trendingMovies, setTrendingMovies] = useState<TrendingMovies[]>([]);
  const [isTrendingMoviesLoading, setIsTrendingMoviesLoading] =
    useState<boolean>(false);
  const [trendingMoviesErrorMessage, setTrendingMoviesErrorMessage] =
    useState<string>("");

  //Debounce the search term to prevent too many API requests
  useDebounce(() => setDebouncedSearchTerm(searchTerm), 800, [searchTerm]);

  const fetchMovies = async (query = ""): Promise<void> => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const endpoint = query
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
      const response = await fetch(endpoint, API_OPTIONS);

      if (!response.ok) throw new Error("Failed to fetch movies");

      const data: MovieResponse = await response.json();

      if (!data.results || data.results.length === 0) {
        setErrorMessage("No movies found");
        setMovieList([]);
      }

      setMovieList(data.results || []);

      if (query && data.results.length > 0)
        await updateSearchCount(query, data.results[0]);
    } catch (error) {
      console.error(`Error fetching movies: ${error}`);
      setErrorMessage("Error fetching movies. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrendingMovies = async () => {
    setIsTrendingMoviesLoading(true);
    setTrendingMoviesErrorMessage("");
    try {
      const movies = await getTrendingMovies();
      setTrendingMovies(movies);
    } catch (error) {
      console.error(`Error fetching trending movies: ${error}`);
      setTrendingMoviesErrorMessage(
        "Error fetching movies. Please try again later."
      );
    } finally {
      setIsTrendingMoviesLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    loadTrendingMovies();
  }, []);

  return (
    <main>
      <div className="pattern"></div>
      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="Hero Banner" />
          <h1>
            Find <span className="text-gradient">Movies</span> You'll Enjoy
            Without the Hassle
          </h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        {trendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Movies</h2>
            {isTrendingMoviesLoading ? (
              <Spinner />
            ) : trendingMoviesErrorMessage ? (
              <p className="text-red-500">{trendingMoviesErrorMessage}</p>
            ) : (
              <ul>
                {trendingMovies.map((movie, index) => (
                  <li key={movie.$id}>
                    <p>{index + 1}</p>
                    <img src={movie.poster_url} alt={movie.searchTerm} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <section className="all-movies">
          <h2>Popular Movies</h2>
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
      </div>
    </main>
  );
};

export default App;
