'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import FilterSidebar from '@/components/FilterSidebar';
import ProductCard from '@/components/ProductCard';
import { SkeletonCategoryPage, SkeletonCard, Skeleton } from '@/components/Skeleton';
import { decodeHtmlEntities } from '@/lib/utils';
import styles from '../category.module.css';

interface Product {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  images: Array<{ src: string; alt: string }>;
  average_rating: string;
  rating_count: number;
  attributes: Array<{ name: string; options: string[] }>;
  meta_data: Array<{ key: string; value: string }>;
  [key: string]: any;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  parent: number;
}

/**
 * Extract numeric price value from Store API price (handles formatted strings and pence/cents)
 */
function extractPriceValue(price: any): string {
  if (!price && price !== 0) return '0.00';

  let numericValue: number;

  if (typeof price === 'number') {
    numericValue = price;
  } else {
    // Remove currency symbols and extract number
    const match = price.toString().replace(/[£$€,\s]/g, '').match(/[\d.]+/);
    numericValue = match ? parseFloat(match[0]) : 0;
  }

  // WooCommerce Store API may return prices as integers in smallest currency unit (pence/cents)
  // If it's a whole number and seems large (likely in pence), divide by 100
  // Check if it's a whole number and > 50 (to avoid dividing £0.50 = 50 pence)
  if (Number.isInteger(numericValue) && numericValue > 50 && numericValue < 1000000) {
    // Likely in pence/cents, convert to main currency unit
    numericValue = numericValue / 100;
  }

  // Format to 2 decimal places
  return numericValue.toFixed(2);
}

/**
 * Map WooCommerce Store API product to ProductCard format
 */
function mapStoreApiProduct(storeProduct: any): Product {
  // Store API uses prices.price instead of price
  const rawPrice = storeProduct.prices?.price || storeProduct.price || '0';
  const rawRegularPrice = storeProduct.prices?.regular_price || storeProduct.regular_price || rawPrice;
  const rawSalePrice = storeProduct.prices?.sale_price || storeProduct.sale_price || '';

  const price = extractPriceValue(rawPrice);
  const regularPrice = extractPriceValue(rawRegularPrice);
  const salePrice = rawSalePrice ? extractPriceValue(rawSalePrice) : '';

  const onSale = price !== regularPrice &&
    regularPrice !== '0.00' &&
    parseFloat(price) < parseFloat(regularPrice);

  return {
    id: storeProduct.id,
    name: decodeHtmlEntities(storeProduct.name || ''),
    slug: storeProduct.slug || '',
    permalink: storeProduct.permalink || `/product/${storeProduct.slug}`,
    price: price,
    regular_price: regularPrice,
    sale_price: salePrice,
    on_sale: onSale,
    images: storeProduct.images?.map((img: any) => ({
      src: img.src || img.url || '',
      alt: decodeHtmlEntities(img.alt || storeProduct.name || ''),
    })) || [],
    average_rating: storeProduct.average_rating?.toString() || '0',
    rating_count: storeProduct.rating_count || 0,
    attributes: storeProduct.attributes || [],
    meta_data: storeProduct.meta_data || [],
    categories: storeProduct.categories || [],
  };
}

export default function CategoryPageClient({ initialData, slug, initialSearchParams }: { initialData: any, slug: string, initialSearchParams: any }) {

  const [category, setCategory] = useState<Category | null>(initialData?.category ? {
    id: initialData.category.id,
    name: decodeHtmlEntities(initialData.category.name || ''),
    slug: initialData.category.slug || '',
    description: decodeHtmlEntities(initialData.category.description || ''),
    parent: initialData.category.parent || 0,
  } : null);

  const [parentCategory, setParentCategory] = useState<Category | null>(initialData?.parentCategory ? {
    id: initialData.parentCategory.id,
    name: decodeHtmlEntities(initialData.parentCategory.name || ''),
    slug: initialData.parentCategory.slug || '',
    description: decodeHtmlEntities(initialData.parentCategory.description || ''),
    parent: initialData.parentCategory.parent || 0,
  } : null);

  const [subcategories, setSubcategories] = useState<Category[]>(initialData?.subcategories ? initialData.subcategories.map((cat: any) => ({
    id: cat.id,
    name: decodeHtmlEntities(cat.name || ''),
    slug: cat.slug || '',
    description: decodeHtmlEntities(cat.description || ''),
    parent: cat.parent || 0,
  })) : []);

  const [products, setProducts] = useState<Product[]>(initialData?.products ? initialData.products.map(mapStoreApiProduct) : []);
  const [loading, setLoading] = useState(!initialData);
  const [sortBy, setSortBy] = useState('price-asc');
  const [filters, setFilters] = useState({
    subcategories: typeof initialSearchParams?.subcategory === 'string'
      ? initialSearchParams.subcategory.split(',')
      : Array.isArray(initialSearchParams?.subcategory)
        ? initialSearchParams.subcategory
        : [],
    minPrice: initialSearchParams?.min_price || '',
    maxPrice: initialSearchParams?.max_price || '',
    rating: initialSearchParams?.rating || '',
  });

  useEffect(() => {
    if (initialData) {
      setCategory(initialData.category ? {
        id: initialData.category.id,
        name: decodeHtmlEntities(initialData.category.name || ''),
        slug: initialData.category.slug || '',
        description: decodeHtmlEntities(initialData.category.description || ''),
        parent: initialData.category.parent || 0,
      } : null);

      setParentCategory(initialData.parentCategory ? {
        id: initialData.parentCategory.id,
        name: decodeHtmlEntities(initialData.parentCategory.name || ''),
        slug: initialData.parentCategory.slug || '',
        description: decodeHtmlEntities(initialData.parentCategory.description || ''),
        parent: initialData.parentCategory.parent || 0,
      } : null);

      setSubcategories(initialData.subcategories ? initialData.subcategories.map((cat: any) => ({
        id: cat.id,
        name: decodeHtmlEntities(cat.name || ''),
        slug: cat.slug || '',
        description: decodeHtmlEntities(cat.description || ''),
        parent: cat.parent || 0,
      })) : []);

      setProducts(initialData.products ? initialData.products.map(mapStoreApiProduct) : []);
      setLoading(false);

      // Update filters for new category
      setFilters({
        subcategories: typeof initialSearchParams?.subcategory === 'string'
          ? initialSearchParams.subcategory.split(',')
          : Array.isArray(initialSearchParams?.subcategory)
            ? initialSearchParams.subcategory
            : [],
        minPrice: initialSearchParams?.min_price || '',
        maxPrice: initialSearchParams?.max_price || '',
        rating: initialSearchParams?.rating || '',
      });
    } else {
      fetchCategoryData();
    }
  }, [initialData, slug]);

  const fetchCategoryData = async () => {
    try {
      setLoading(true);
      const WOOCOMMERCE_URL =
        process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || process.env.WOOCOMMERCE_URL || '';

      if (!slug) {
        setCategory(null);
        return;
      }

      // Handle nested slugs (e.g., "filters/carbon-filters")
      const slugParts = slug.split('/');
      const categorySlug = slugParts[slugParts.length - 1]; // Get the last part

      // Fetch all categories and find by slug (Store API may not support slug filter)
      // Use hide_empty=false to include categories without products
      const categoryResponse = await fetch(
        `${WOOCOMMERCE_URL}/wp-json/wc/store/v1/products/categories?per_page=100&hide_empty=false`
      );

      if (!categoryResponse.ok) {
        console.error('Category fetch failed:', categoryResponse.status, await categoryResponse.text());
        setCategory(null);
        return;
      }

      const categories = await categoryResponse.json();

      // WooCommerce Store API returns array directly
      const categoryList = Array.isArray(categories) ? categories : [];

      // Find category by slug
      const foundCategory = categoryList.find((cat: any) =>
        cat.slug === categorySlug || cat.slug === slug
      );

      if (!foundCategory) {
        console.log('Category not found for slug:', categorySlug, 'Available slugs:', categoryList.map((c: any) => c.slug));
        setCategory(null);
        return;
      }

      // Map WooCommerce category to our Category interface
      const categoryData: Category = {
        id: foundCategory.id,
        name: decodeHtmlEntities(foundCategory.name || foundCategory.title || ''),
        slug: foundCategory.slug || categorySlug,
        description: decodeHtmlEntities(foundCategory.description || foundCategory.excerpt || ''),
        parent: foundCategory.parent || 0,
      };

      setCategory(categoryData);

      // Fetch parent category if exists
      if (categoryData.parent && categoryData.parent > 0) {
        try {
          const parentResponse = await fetch(
            `${WOOCOMMERCE_URL}/wp-json/wc/store/v1/products/categories/${categoryData.parent}`
          );
          if (parentResponse.ok) {
            const parent = await parentResponse.json();
            if (parent && !parent.code) {
              setParentCategory({
                id: parent.id,
                name: decodeHtmlEntities(parent.name || ''),
                slug: parent.slug || '',
                description: decodeHtmlEntities(parent.description || ''),
                parent: parent.parent || 0,
              });
            }
          }
        } catch (err) {
          console.error('Error fetching parent category:', err);
        }
      } else {
        setParentCategory(null);
      }

      // Fetch subcategories
      try {
        const subcategoriesResponse = await fetch(
          `${WOOCOMMERCE_URL}/wp-json/wc/store/v1/products/categories?parent=${categoryData.id}&per_page=100&hide_empty=false`
        );
        if (subcategoriesResponse.ok) {
          const subcategories = await subcategoriesResponse.json();
          const subcategoryList = Array.isArray(subcategories) ? subcategories : (subcategories.data || []);
          // Filter to ensure only direct children (subcategories) of current category are shown
          const directSubcategories = subcategoryList.filter((cat: any) =>
            cat.parent === categoryData.id || cat.parent === categoryData.id.toString()
          );
          setSubcategories(directSubcategories.map((cat: any) => ({
            id: cat.id,
            name: decodeHtmlEntities(cat.name || ''),
            slug: cat.slug || '',
            description: decodeHtmlEntities(cat.description || ''),
            parent: cat.parent || 0,
          })));
        }
      } catch (err) {
        console.error('Error fetching subcategories:', err);
        setSubcategories([]);
      }

      // Fetch products in this category
      try {
        const productsResponse = await fetch(
          `${WOOCOMMERCE_URL}/wp-json/wc/store/v1/products?category=${categoryData.id}&per_page=100`
        );
        let products = [];
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          const rawProducts = Array.isArray(productsData) ? productsData : (productsData.data || []);
          // Map Store API products to ProductCard format
          products = rawProducts.map(mapStoreApiProduct);
        }

        setProducts(products);
      } catch (err) {
        console.error('Error fetching products:', err);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching category data:', error);
      setCategory(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    const queryParams = new URLSearchParams();
    if (newFilters.subcategories?.length > 0) {
      queryParams.append('subcategory', newFilters.subcategories.join(','));
    }
    if (newFilters.minPrice) queryParams.append('min_price', newFilters.minPrice);
    if (newFilters.maxPrice) queryParams.append('max_price', newFilters.maxPrice);
    if (newFilters.rating) queryParams.append('rating', newFilters.rating);

    window.history.pushState({}, '', `?${queryParams.toString()}`);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  };

  const filteredProducts = products.filter((product) => {
    const basePrice = parseFloat(product.price || product.sale_price || product.regular_price || '0');
    const averageRating = parseFloat(product.average_rating || '0');

    const matchesCategory = filters.subcategories.length > 0
      ? product.categories?.some((cat: any) => filters.subcategories.includes(cat.id.toString()))
      : true;
    const matchesMinPrice = filters.minPrice ? basePrice >= parseFloat(filters.minPrice) : true;
    const matchesMaxPrice = filters.maxPrice ? basePrice <= parseFloat(filters.maxPrice) : true;
    const matchesRating = filters.rating ? averageRating >= parseFloat(filters.rating) : true;

    return matchesCategory && matchesMinPrice && matchesMaxPrice && matchesRating;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return parseFloat(a.price || '0') - parseFloat(b.price || '0');
      case 'price-desc':
        return parseFloat(b.price || '0') - parseFloat(a.price || '0');
      case 'rating':
        return parseFloat(b.average_rating || '0') - parseFloat(a.average_rating || '0');
      case 'name-asc':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className={styles.categoryPage}>
        <div className={styles.breadcrumbsWrapper}>
          <div className={styles.breadcrumbs}>
            <Skeleton height="1rem" width="100px" />
          </div>
        </div>
        <div className={styles.headerSection}>
          <div className={styles.headerContent}>
            <Skeleton height="2rem" width="40%" className={styles.skeletonSpacing} />
            <Skeleton height="1rem" width="60%" />
          </div>
        </div>
        <div className={styles.mainContent}>
          <div className={styles.sidebar}>
            <Skeleton height="2rem" width="80%" className={styles.skeletonSpacing} />
            <Skeleton height="200px" borderRadius="8px" />
          </div>
          <div className={styles.productGrid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className={styles.error}>
        <h1>Category not found</h1>
        <Link href="/">Go to Home</Link>
      </div>
    );
  }

  return (
    <div className={styles.categoryPage}>
      {/* Breadcrumbs */}
      <div className={styles.breadcrumbsWrapper}>
        <div className={styles.breadcrumbs}>
          <Link href="/">Home</Link>
          {parentCategory && (
            <>
              <span className={styles.separator}>›</span>
              <Link href={`/product-category/${parentCategory.slug}`}>
                {parentCategory.name}
              </Link>
            </>
          )}
          <span className={styles.separator}>›</span>
          <span>{category.name}</span>
        </div>
      </div>

      {/* Header Section */}
      <div className={styles.headerSection}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>{category.name}</h1>
          <p className={styles.description}>
            {category.description || `Discover our complete range of premium ${category.name.toLowerCase()} designed for every need and budget.`}
          </p>
        </div>
      </div>

      {/* Product Count and Sorting */}
      <div className={styles.toolbar}>
        <div className={styles.productCount}>
          {sortedProducts.length} {sortedProducts.length === 1 ? 'product' : 'products'} found
        </div>
        <div className={styles.sortContainer}>
          <label htmlFor="sort" className={styles.sortLabel}>Sort by:</label>
          <select
            id="sort"
            className={styles.sortSelect}
            value={sortBy}
            onChange={handleSortChange}
          >
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Rating</option>
            <option value="name-asc">Name: A to Z</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Filter Sidebar */}
        <FilterSidebar
          subcategories={subcategories}
          filters={filters}
          onFilterChange={handleFilterChange}
          products={products}
        />

        {/* Product Grid */}
        <div className={styles.productGrid}>
          {sortedProducts.length > 0 ? (
            sortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <div className={styles.noProducts}>
              <p>No products found in this category.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

