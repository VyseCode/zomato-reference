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
