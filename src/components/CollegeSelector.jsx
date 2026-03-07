
import { useState, useEffect, useRef } from 'react';
import { useColleges } from '../hooks/useColleges';
import './CollegeSelector.css';

const CollegeSelector = ({ value, onChange, placeholder = "Search for your college...", error, required = false, hideLabel = false }) => {
    const { searchColleges, loading } = useColleges();
    const [searchTerm, setSearchTerm] = useState(value || '');
    const [suggestions, setSuggestions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        setSearchTerm(value || '');
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        const query = e.target.value;
        setSearchTerm(query);
        onChange(query); // Update parent value as typing

        if (query.length >= 2) {
            const results = searchColleges(query);
            setSuggestions(results);
            setIsOpen(true);
        } else {
            setSuggestions([]);
            setIsOpen(false);
        }
    };

    const handleSelect = (college) => {
        setSearchTerm(college.fullName);
        onChange(college.fullName);
        setIsOpen(false);
    };

    return (
        <div className="college-selector-wrapper" ref={wrapperRef}>
            <div className="input-group">
                {!hideLabel && (
                    <label className="input-label">
                        College{required && <span className="required">*</span>}
                    </label>
                )}
                <div className="input-with-icon">
                    <input
                        type="text"
                        className={`input ${error ? 'input-error' : ''}`}
                        value={searchTerm}
                        onChange={handleInputChange}
                        onFocus={() => searchTerm.length >= 2 && setIsOpen(true)}
                        placeholder={loading ? "Loading colleges..." : placeholder}
                        disabled={loading}
                    />
                    {loading && <div className="spinner-small"></div>}
                </div>
                {error && <span className="error-message">{error}</span>}
            </div>

            {isOpen && suggestions.length > 0 && (
                <ul className="suggestions-list">
                    {suggestions.map((college, index) => (
                        <li
                            key={index}
                            className="suggestion-item"
                            onClick={() => handleSelect(college)}
                        >
                            <span className="college-name">{college.name}</span>
                            {college.district && (
                                <span className="college-district">, {college.district}</span>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {isOpen && searchTerm.length >= 2 && suggestions.length === 0 && !loading && (
                <div className="no-suggestions">
                    No colleges found. You can still use "{searchTerm}"
                </div>
            )}
        </div>
    );
};

export default CollegeSelector;
