'use client';

import { MouseEvent } from 'react';
import { addToCart } from '@/lib/cart';
import { sendGAEvent } from '@next/third-parties/google';

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

    sendGAEvent('event', 'add_to_cart', {
      currency: 'GBP',
      value: parseFloat(product.price),
      items: [{
        item_id: product.id,
        item_name: product.title,
        price: parseFloat(product.price),
        quantity: 1
      }]
    });
  };

  return (
    <button type="button" className={className} onClick={handleAddToCart}>
      Add to Cart
    </button>
  );
}

