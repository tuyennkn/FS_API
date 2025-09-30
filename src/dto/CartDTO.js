class CartDTO {
  static toResponse(cart) {
    if (!cart) return null;
    
    return {
      id: cart._id,
      user_id: cart.user_id,
      items: cart.items?.map(item => ({
        product_id: item.product._id || item.product,
        product: item.product.title ? {
          id: item.product._id,
          title: item.product.title,
          author: item.product.author,
          price: item.product.price,
          image: item.product.image?.[0],
          slug: item.product.slug,
          quantity: item.product.quantity
        } : undefined,
        quantity: item.quantity
      })) || [],
      total_items: cart.total_items,
      total_price: cart.total_price,
      created_at: cart.createdAt,
      updated_at: cart.updatedAt
    };
  }

  static toListResponse(carts) {
    return carts.map(cart => this.toResponse(cart));
  }

  static fromAddItemRequest(data) {
    return {
      product_id: data.product_id,
      quantity: data.quantity || 1
    };
  }

  static fromUpdateItemRequest(data) {
    return {
      product_id: data.product_id,
      quantity: data.quantity
    };
  }
}

export { CartDTO };