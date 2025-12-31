'use client';

import { MouseEvent } from 'react';
import { addToCart } from '@/lib/cart';

type AddToCartButtonProps = {
  product: {
    id: number;
    title: string;
    slug: string;
    image: string;
    price: string;
  };
  className?: string;
};

export default function AddToCartButton({ product, className }: AddToCartButtonProps) {
  const handleAddToCart = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    addToCart({
      id: product.id,
      name: product.title,
      price: product.price,
      image: product.image,
      slug: product.slug,
    });
  };

  return (
    <button type="button" className={className} onClick={handleAddToCart}>
      Add to Cart
    </button>
  );
}

