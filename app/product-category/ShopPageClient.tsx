'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import FilterSidebar from '@/components/FilterSidebar';
import ProductCard, { type Product } from '@/components/ProductCard';
import { decodeHtmlEntities } from '@/lib/utils';
import styles from './category.module.css';

interface Category {
    id: number;
    name: string;
    slug: string;
    parent: number;
}

interface ShopPageClientProps {
    initialCategories: any[];
    initialProducts: any[];
    searchParams: { [key: string]: string | string[] | undefined };
}

function extractPriceValue(price: any): string {
    if (!price && price !== 0) return '0.00';
    let numericValue: number;
    if (typeof price === 'number') {
        numericValue = price;
    } else {
        const match = price.toString().replace(/[£$€,\s]/g, '').match(/[\d.]+/);
        numericValue = match ? parseFloat(match[0]) : 0;
    }
    if (Number.isInteger(numericValue) && numericValue > 50 && numericValue < 1000000) {
        numericValue = numericValue / 100;
    }
    return numericValue.toFixed(2);
}

function mapStoreApiProduct(storeProduct: any): Product {
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

export default function ShopPageClient({ initialCategories, initialProducts, searchParams }: ShopPageClientProps) {
    const router = useRouter();

    const categories = useMemo(() => initialCategories.map(cat => ({
        id: cat.id,
        name: decodeHtmlEntities(cat.name || ''),
        slug: cat.slug || '',
        parent: cat.parent || 0
    })), [initialCategories]);

    const products = useMemo(() => initialProducts.map(mapStoreApiProduct), [initialProducts]);

    const [sortBy, setSortBy] = useState('price-asc');

    const filters = {
        subcategories: typeof searchParams.subcategory === 'string'
            ? searchParams.subcategory.split(',')
            : Array.isArray(searchParams.subcategory)
                ? searchParams.subcategory
                : [],
        minPrice: typeof searchParams.min_price === 'string' ? searchParams.min_price : '',
        maxPrice: typeof searchParams.max_price === 'string' ? searchParams.max_price : '',
        rating: typeof searchParams.rating === 'string' ? searchParams.rating : '',
    };

    const handleFilterChange = (newFilters: any) => {
        const params = new URLSearchParams();
        if (newFilters.subcategories && newFilters.subcategories.length > 0) {
            params.set('subcategory', newFilters.subcategories.join(','));
        }
        if (newFilters.minPrice) params.set('min_price', newFilters.minPrice);
        if (newFilters.maxPrice) params.set('max_price', newFilters.maxPrice);
        if (newFilters.rating) params.set('rating', newFilters.rating);

        router.push(params.toString() ? `/product-category?${params.toString()}` : '/product-category', {
            scroll: false,
        });
    };

    const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSortBy(event.target.value);
    };

    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const basePrice = parseFloat(product.price || product.sale_price || product.regular_price || '0');
            const averageRating = parseFloat(product.average_rating || '0');

            const matchesCategory = filters.subcategories.length > 0
                ? product.categories?.some((category: any) => filters.subcategories.includes(category.id.toString()))
                : true;
            const matchesMinPrice = filters.minPrice ? basePrice >= parseFloat(filters.minPrice) : true;
            const matchesMaxPrice = filters.maxPrice ? basePrice <= parseFloat(filters.maxPrice) : true;
            const matchesRating = filters.rating ? averageRating >= parseFloat(filters.rating) : true;

            return matchesCategory && matchesMinPrice && matchesMaxPrice && matchesRating;
        });
    }, [products, filters]);

    const sortedProducts = useMemo(() => {
        const cloned = [...filteredProducts];
        switch (sortBy) {
            case 'price-asc':
                return cloned.sort((a, b) => parseFloat(a.price || '0') - parseFloat(b.price || '0'));
            case 'price-desc':
                return cloned.sort((a, b) => parseFloat(b.price || '0') - parseFloat(a.price || '0'));
            case 'rating':
                return cloned.sort((a, b) => parseFloat(b.average_rating || '0') - parseFloat(a.average_rating || '0'));
            case 'name-asc':
                return cloned.sort((a, b) => a.name.localeCompare(b.name));
            default:
                return cloned;
        }
    }, [filteredProducts, sortBy]);

    const topLevelCategories = useMemo(
        () => categories.filter((category) => category.parent === 0),
        [categories]
    );

    return (
        <div className={styles.categoryPage}>
            <div className={styles.breadcrumbsWrapper}>
                <div className={styles.breadcrumbs}>
                    <Link href="/">Home</Link>
                    <span className={styles.separator}>›</span>
                    <span>Shop</span>
                </div>
            </div>

            <div className={styles.headerSection}>
                <div className={styles.headerContent}>
                    <h1 className={styles.title}>Shop All Products</h1>
                    <p className={styles.description}>
                        Discover our full range of water purification systems, filters, testing tools, accessories and hydration essentials designed to elevate every sip.
                    </p>
                </div>
            </div>

            <div className={styles.toolbar}>
                <div className={styles.productCount}>
                    {sortedProducts.length} {sortedProducts.length === 1 ? 'product' : 'products'} found
                </div>
                <div className={styles.sortContainer}>
                    <label htmlFor="sort" className={styles.sortLabel}>Sort by:</label>
                    <select id="sort" className={styles.sortSelect} value={sortBy} onChange={handleSortChange}>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                        <option value="rating">Rating</option>
                        <option value="name-asc">Name: A to Z</option>
                    </select>
                </div>
            </div>

            <div className={styles.mainContent}>
                <FilterSidebar
                    subcategories={topLevelCategories}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    products={products}
                />
                <div className={styles.productGrid}>
                    {sortedProducts.length > 0 ? (
                        sortedProducts.map((product) => <ProductCard key={product.id} product={product} />)
                    ) : (
                        <div className={styles.noProducts}>
                            <p>No products match your filters. Try adjusting the options above.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
