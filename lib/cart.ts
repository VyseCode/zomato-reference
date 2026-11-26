import { Cart } from "@/models/Cart";
import { Restaurant } from "@/models/Restaurant";
import { toCartItem, toRestaurantCard, type CartDTO } from "@/lib/serialize";

export const EMPTY_CART: CartDTO = {
  restaurant: null,
  items: [],
  subtotal: 0,
  deliveryFee: 0,
  minimumOrder: 0,
  total: 0,
  belowMinimum: false,
};

export async function getCartView(userId: string): Promise<CartDTO> {
  const cart = await Cart.findOne({ user: userId }).lean();
  if (!cart || cart.items.length === 0) return EMPTY_CART;

  const restaurant = cart.restaurant
    ? await Restaurant.findById(cart.restaurant).lean()
    : null;
  if (!restaurant) return EMPTY_CART;

  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );
  return {
    restaurant: toRestaurantCard(restaurant),
    items: cart.items.map(toCartItem),
    subtotal,
    deliveryFee: restaurant.deliveryFee,
    minimumOrder: restaurant.minimumOrder,
    total: subtotal + restaurant.deliveryFee,
    belowMinimum: subtotal < restaurant.minimumOrder,
  };
}
