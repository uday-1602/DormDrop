
import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import Fuse from 'fuse.js';

let cachedColleges = null;

export const useColleges = () => {
    const [colleges, setColleges] = useState(cachedColleges || []);
    const [loading, setLoading] = useState(!cachedColleges);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (cachedColleges) return;

        const loadColleges = async () => {
            try {
                const response = await fetch('/colleges.csv');
                const csvText = await response.text();

                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        const parsed = results.data
                            .filter(row => row['Name of the college'])
                            .map(row => {
                                const name = row['Name of the college'].trim().replace(/^"|"$/g, '').replace(/,$/, '').trim();
                                const district = row['District'] ? row['District'].trim() : '';
                                return {
                                    name,
                                    district,
                                    fullName: district ? `${name}, ${district}` : name
                                };
                            });

                        cachedColleges = parsed;
                        setColleges(parsed);
                        setLoading(false);
                    },
                    error: (err) => {
                        console.error('CSV Parsing error:', err);
                        setError(err);
                        setLoading(false);
                    }
                });
            } catch (err) {
                console.error('Fetch error:', err);
                setError(err);
                setLoading(false);
            }
        };

        loadColleges();
    }, []);

    const searchColleges = (query) => {
        if (!query || query.length < 2) return [];

        const fuse = new Fuse(colleges, {
            keys: ['fullName'],
            threshold: 0.3,
            limit: 20
        });

        return fuse.search(query).map(result => result.item);
    };

    return { colleges, loading, error, searchColleges };
};
