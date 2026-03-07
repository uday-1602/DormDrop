
import { useState, useEffect, useRef } from 'react';
import { CATEGORIES } from '../constants';
import './CategorySelector.css';

const CategorySelector = ({ value, onChange, placeholder = "Categories" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    // Find the current category object by value
    const selectedCategory = CATEGORIES.find(c => c.value === value) || CATEGORIES[0];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (category) => {
        onChange(category.value);
        setIsOpen(false);
    };

    return (
        <div className="category-selector-wrapper" ref={wrapperRef}>
            <div className="input-group">
                <div
                    className={`custom-select-trigger ${isOpen ? 'active' : ''}`}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span className={`selected-value ${!value ? 'is-placeholder' : ''}`}>
                        {selectedCategory.name}
                    </span>
                    <div className="select-arrow">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m6 9 6 6 6-6" />
                        </svg>
                    </div>
                </div>
            </div>

            {isOpen && (
                <ul className="suggestions-list">
                    {CATEGORIES.map((category, index) => (
                        <li
                            key={index}
                            className={`suggestion-item ${value === category.value ? 'selected' : ''}`}
                            onClick={() => handleSelect(category)}
                        >
                            <span className="category-name">{category.name}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default CategorySelector;
