
import { useMemo } from 'react';
import Fuse from 'fuse.js';
import { colleges as collegesList } from '../constants';

// Pre-build the college objects once from our curated list
const collegeObjects = collegesList.map(name => {
    // Extract abbreviation from parentheses e.g. "Delhi Technological University (DTU)" -> "DTU"
    const match = name.match(/\(([^)]+)\)/);
    const abbreviation = match ? match[1] : '';
    return { name, abbreviation, fullName: name };
});

export const useColleges = () => {
    const fuse = useMemo(() => new Fuse(collegeObjects, {
        keys: ['name', 'abbreviation'],
        threshold: 0.35,
        limit: 20,
        ignoreLocation: true,   // match anywhere in the string, not just the start
    }), []);

    const searchColleges = (query) => {
        if (!query || query.length < 2) return [];
        return fuse.search(query).map(result => result.item);
    };

    return { colleges: collegeObjects, loading: false, error: null, searchColleges };
};
