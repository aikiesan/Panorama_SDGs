import { useState, useEffect, useRef } from 'react';
import { dashboardAPI } from '../../services/api/dashboardAPI';

interface SearchResult {
  id: string;
  type: 'project' | 'city' | 'country' | 'sdg';
  name: string;
  subtitle?: string;
  icon: string;
}

interface SmartSearchProps {
  onProjectSelect: (projectId: string) => void;
  onFilterChange: (filter: { city?: string; country?: string; sdg?: number }) => void;
  autoFocus?: boolean;
}

export default function SmartSearch({ onProjectSelect, onFilterChange, autoFocus }: SmartSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search function with debouncing
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const searchTimer = setTimeout(async () => {
      setIsLoading(true);
      try {
        // Fetch all projects and filter locally (in production, do this server-side)
        const projectsData = await dashboardAPI.getProjects({ search: query }, 1, 10);
        const projects = projectsData.projects || [];

        const searchResults: SearchResult[] = [];

        // Add matching projects
        projects.forEach((project: any) => {
          searchResults.push({
            id: project.id,
            type: 'project',
            name: project.projectName,
            subtitle: `${project.city}, ${project.country}`,
            icon: '📍',
          });
        });

        // Extract unique cities and countries
        const cities = new Set<string>();
        const countries = new Set<string>();
        projects.forEach((project: any) => {
          if (project.city?.toLowerCase().includes(query.toLowerCase())) {
            cities.add(project.city);
          }
          if (project.country?.toLowerCase().includes(query.toLowerCase())) {
            countries.add(project.country);
          }
        });

        // Add city results
        Array.from(cities).slice(0, 3).forEach((city) => {
          searchResults.push({
            id: city,
            type: 'city',
            name: city,
            subtitle: 'Filter by city',
            icon: '🏙️',
          });
        });

        // Add country results
        Array.from(countries).slice(0, 3).forEach((country) => {
          searchResults.push({
            id: country,
            type: 'country',
            name: country,
            subtitle: 'Filter by country',
            icon: '🌍',
          });
        });

        // Check for SDG matches
        const sdgMatch = query.match(/sdg\s*(\d+)/i);
        if (sdgMatch) {
          const sdgNum = parseInt(sdgMatch[1]);
          if (sdgNum >= 1 && sdgNum <= 17) {
            searchResults.unshift({
              id: sdgNum.toString(),
              type: 'sdg',
              name: `SDG ${sdgNum}`,
              subtitle: 'Filter by Sustainable Development Goal',
              icon: '🎯',
            });
          }
        }

        setResults(searchResults);
        setIsOpen(searchResults.length > 0);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(searchTimer);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleResultClick(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    switch (result.type) {
      case 'project':
        onProjectSelect(result.id);
        break;
      case 'city':
        onFilterChange({ city: result.id });
        break;
      case 'country':
        // In a full implementation, you'd handle country filtering
        break;
      case 'sdg':
        onFilterChange({ sdg: parseInt(result.id) });
        break;
    }
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-xl">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && results.length > 0 && setIsOpen(true)}
          placeholder="Search projects, cities, or SDGs..."
          autoFocus={autoFocus}
          className="w-full pl-10 pr-10 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder-gray-400 text-gray-900"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-700 text-gray-400"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-2xl shadow-black/10 overflow-hidden z-[9999] max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin"></div>
              <p className="mt-2 text-sm">Searching...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">No results found</p>
            </div>
          ) : (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full px-4 py-3 flex items-center gap-3 transition-colors text-left ${
                    index === selectedIndex
                      ? 'bg-primary-50 border-l-4 border-primary-500'
                      : 'hover:bg-gray-50 border-l-4 border-transparent'
                  }`}
                >
                  {/* Icon */}
                  <span className="text-2xl flex-shrink-0">{result.icon}</span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{result.name}</div>
                    {result.subtitle && (
                      <div className="text-xs text-gray-500 truncate">{result.subtitle}</div>
                    )}
                  </div>

                  {/* Type Badge */}
                  <span
                    className={`flex-shrink-0 px-2 py-1 rounded text-[10px] font-medium uppercase tracking-wide ${
                      result.type === 'project'
                        ? 'bg-blue-100 text-blue-700'
                        : result.type === 'city'
                        ? 'bg-green-100 text-green-700'
                        : result.type === 'sdg'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {result.type}
                  </span>
                </button>
              ))}

              {/* Footer Hint */}
              <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                <p className="text-[10px] text-gray-500 text-center">
                  Use ↑↓ arrows to navigate, Enter to select, Esc to close
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
