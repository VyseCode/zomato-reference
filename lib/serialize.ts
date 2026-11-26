import type { Types } from "mongoose";

export type RestaurantCardDTO = {
  id: string;
  name: string;
  cuisines: string[];
  area: string;
  address: string;
  description: string;
  imageUrl: string;
  etaMinutes: number;
  deliveryFee: number;
  minimumOrder: number;
  ratingAvg: number;
  ratingCount: number;
  isActive: boolean;
  favorite: boolean;
};

export type MenuItemDTO = {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  category: string;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
  imageUrl: string;
};

export type AddressDTO = {
  id: string;
  label: string;
  line1: string;
  line2: string;
  city: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
};

type LeanRestaurant = {
  _id: Types.ObjectId;
  name: string;
  cuisines: string[];
  area: string;
  address: string;
  description: string;
  imageUrl: string;
  etaMinutes: number;
  deliveryFee: number;
  minimumOrder: number;
  ratingAvg: number;
  ratingCount: number;
  isActive: boolean;
};

type LeanMenuItem = {
  _id: Types.ObjectId;
  restaurant: Types.ObjectId;
  name: string;
  description: string;
  category: string;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
  imageUrl: string;
};

type LeanAddress = {
  _id: Types.ObjectId;
  label: string;
  line1: string;
  line2: string;
  city: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
};

export function toRestaurantCard(
  doc: LeanRestaurant,
  favoriteIds: Set<string> = new Set(),
): RestaurantCardDTO {
  return {
    id: doc._id.toString(),
    name: doc.name,
    cuisines: doc.cuisines ?? [],
    area: doc.area,
    address: doc.address ?? "",
    description: doc.description ?? "",
    imageUrl: doc.imageUrl ?? "",
    etaMinutes: doc.etaMinutes,
    deliveryFee: doc.deliveryFee,
    minimumOrder: doc.minimumOrder,
    ratingAvg: doc.ratingAvg ?? 0,
    ratingCount: doc.ratingCount ?? 0,
    isActive: doc.isActive ?? true,
    favorite: favoriteIds.has(doc._id.toString()),
  };
}

export function toMenuItem(doc: LeanMenuItem): MenuItemDTO {
  return {
    id: doc._id.toString(),
    restaurantId: doc.restaurant.toString(),
    name: doc.name,
    description: doc.description ?? "",
    category: doc.category,
    price: doc.price,
    isVeg: doc.isVeg,
    isAvailable: doc.isAvailable ?? true,
    imageUrl: doc.imageUrl ?? "",
  };
}

export type CartItemDTO = {
  id: string;
  menuItem: string;
  name: string;
  price: number;
  qty: number;
  isVeg: boolean;
};

export type CartDTO = {
  restaurant: RestaurantCardDTO | null;
  items: CartItemDTO[];
  subtotal: number;
  deliveryFee: number;
  minimumOrder: number;
  total: number;
  belowMinimum: boolean;
};

export type OrderDTO = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  status: string;
  items: Array<{ id: string; name: string; price: number; qty: number }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  address: {
    label: string;
    line1: string;
    line2: string;
    city: string;
    pincode: string;
    phone: string;
  };
  timeline: Array<{ id: string; status: string; at: string; note: string }>;
  cancelReason: string;
  placedAt: string;
  reviewed: boolean;
};

type LeanCartItem = {
  _id: Types.ObjectId;
  menuItem: Types.ObjectId;
  name: string;
  price: number;
  qty: number;
  isVeg: boolean;
};

type LeanOrder = {
  _id: Types.ObjectId;
  restaurant: Types.ObjectId;
  status: string;
  items: Array<{
    _id: Types.ObjectId;
    name: string;
    price: number;
    qty: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  addressSnapshot: {
    label: string;
    line1: string;
    line2: string;
    city: string;
    pincode: string;
    phone: string;
  };
  timeline: Array<{
    _id: Types.ObjectId;
    status: string;
    at: Date;
    note: string;
  }>;
  cancelReason: string;
  placedAt: Date;
};

export function toCartItem(doc: LeanCartItem): CartItemDTO {
  return {
    id: doc._id.toString(),
    menuItem: doc.menuItem.toString(),
    name: doc.name,
    price: doc.price,
    qty: doc.qty,
    isVeg: doc.isVeg,
  };
}

export function toOrder(
  doc: LeanOrder,
  restaurantName: string,
  reviewed = false,
): OrderDTO {
  return {
    id: doc._id.toString(),
    restaurantId: doc.restaurant.toString(),
    restaurantName,
    status: doc.status,
    items: doc.items.map((item) => ({
      id: item._id.toString(),
      name: item.name,
      price: item.price,
      qty: item.qty,
    })),
    subtotal: doc.subtotal,
    deliveryFee: doc.deliveryFee,
    total: doc.total,
    address: {
      label: doc.addressSnapshot.label,
      line1: doc.addressSnapshot.line1,
      line2: doc.addressSnapshot.line2 ?? "",
      city: doc.addressSnapshot.city,
      pincode: doc.addressSnapshot.pincode,
      phone: doc.addressSnapshot.phone,
    },
    timeline: doc.timeline.map((entry) => ({
      id: entry._id.toString(),
      status: entry.status,
      at: entry.at instanceof Date ? entry.at.toISOString() : String(entry.at),
      note: entry.note ?? "",
    })),
    cancelReason: doc.cancelReason ?? "",
    placedAt:
      doc.placedAt instanceof Date ? doc.placedAt.toISOString() : String(doc.placedAt),
    reviewed,
  };
}

export function toAddress(doc: LeanAddress): AddressDTO {
  return {
    id: doc._id.toString(),
    label: doc.label,
    line1: doc.line1,
    line2: doc.line2 ?? "",
    city: doc.city,
    pincode: doc.pincode,
    phone: doc.phone,
    isDefault: doc.isDefault ?? false,
  };
}
