'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './FilterSidebar.module.css';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Filters {
  subcategories: string[];
  minPrice: string;
  maxPrice: string;
  rating: string;
}

interface FilterSidebarProps {
  subcategories: Category[];
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  products: any[];
}

export default function FilterSidebar({
  subcategories: categoryOptions,
  filters,
  onFilterChange,
  products,
}: FilterSidebarProps) {
  const [priceRange, setPriceRange] = useState({
    min: filters.minPrice || '0',
    max: filters.maxPrice || '1000',
  });

  // Debounce timer ref
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Calculate max price from products
  const maxProductPrice = Math.max(
    ...products.map((p) => parseFloat(p.price || '0')),
    1000
  );

  // Sync local state with props when filters change externally
  useEffect(() => {
    setPriceRange({
      min: filters.minPrice || '0',
      max: filters.maxPrice || maxProductPrice.toString(),
    });
  }, [filters.minPrice, filters.maxPrice, maxProductPrice]);

  const handleSubcategoryChange = (categoryId: number) => {
    const idStr = categoryId.toString();
    const currentSubcategories = filters.subcategories || [];

    // Toggle logic for multiple selection
    const newSubcategories = currentSubcategories.includes(idStr)
      ? currentSubcategories.filter(id => id !== idStr)
      : [...currentSubcategories, idStr];

    const newFilters = {
      ...filters,
      subcategories: newSubcategories,
    };
    onFilterChange(newFilters);
  };

  const handlePriceChange = (type: 'min' | 'max', value: string) => {
    // Update local state immediately for responsive UI
    const newPriceRange = {
      ...priceRange,
      [type]: value,
    };
    setPriceRange(newPriceRange);

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Debounce the filter update (wait 500ms after user stops typing)
    debounceTimer.current = setTimeout(() => {
      const newFilters = {
        ...filters,
        minPrice: newPriceRange.min,
        maxPrice: newPriceRange.max,
      };
      onFilterChange(newFilters);
    }, 500);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const handleRatingChange = (rating: string) => {
    const newFilters = {
      ...filters,
      rating: filters.rating === rating ? '' : rating,
    };
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      subcategories: [],
      minPrice: '',
      maxPrice: '',
      rating: '',
    };
    setPriceRange({ min: '0', max: maxProductPrice.toString() });
    onFilterChange(clearedFilters);
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <h2 className={styles.sidebarTitle}>Filter Products</h2>
        {(filters.subcategories?.length > 0 || filters.minPrice || filters.maxPrice || filters.rating) && (
          <button className={styles.clearButton} onClick={clearFilters}>
            Clear All
          </button>
        )}
      </div>

      {/* Subcategory Filters */}
      {categoryOptions.length > 0 && (
        <div className={styles.filterSection}>
          <h3 className={styles.filterSectionTitle}>Subcategories</h3>
          <div className={styles.checkboxList}>
            {categoryOptions.map((subcategory) => (
              <label key={subcategory.id} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={(filters.subcategories || []).includes(subcategory.id.toString())}
                  onChange={() => handleSubcategoryChange(subcategory.id)}
                  className={styles.checkbox}
                />
                <span className={styles.checkboxText}>{subcategory.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price Range Filter */}
      <div className={styles.filterSection}>
        <h3 className={styles.filterSectionTitle}>Price Range</h3>
        <div className={styles.priceRange}>
          <div className={styles.priceInputs}>
            <input
              type="number"
              min="0"
              max={maxProductPrice}
              value={priceRange.min}
              onChange={(e) => handlePriceChange('min', e.target.value)}
              className={styles.priceInput}
              placeholder="Min"
            />
            <span className={styles.priceSeparator}>-</span>
            <input
              type="number"
              min="0"
              max={maxProductPrice}
              value={priceRange.max}
              onChange={(e) => handlePriceChange('max', e.target.value)}
              className={styles.priceInput}
              placeholder="Max"
            />
          </div>
          <input
            type="range"
            min="0"
            max={maxProductPrice}
            value={priceRange.max}
            onChange={(e) => handlePriceChange('max', e.target.value)}
            className={styles.priceSlider}
          />
          <div className={styles.priceLabels}>
            <span>£0</span>
            <span>£{maxProductPrice}+</span>
          </div>
        </div>
      </div>

      {/* Rating Filter */}
      <div className={styles.filterSection}>
        <h3 className={styles.filterSectionTitle}>Rating</h3>
        <div className={styles.checkboxList}>
          {[5, 4, 3, 2, 1].map((rating) => (
            <label key={rating} className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={filters.rating === rating.toString()}
                onChange={() => handleRatingChange(rating.toString())}
                className={styles.checkbox}
              />
              <span className={styles.ratingText}>
                {'★'.repeat(rating)}{'☆'.repeat(5 - rating)} ({rating}+ stars)
              </span>
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}

