import { z } from "zod";

const objectId = z.string().refine((value) => /^[a-fA-F0-9]{24}$/.test(value), "Invalid id");

export const restaurantSchema = z.object({
  name: z.string().trim().min(2, "Restaurant name is required").max(120),
  cuisines: z.array(z.string().trim().min(1)).min(1, "Add at least one cuisine").max(10),
  area: z.string().trim().min(2, "Area is required").max(80),
  address: z.string().trim().max(200).default(""),
  description: z.string().trim().max(1000).default(""),
  imageUrl: z.string().trim().max(500).default(""),
  etaMinutes: z.number().int().min(5).max(180),
  deliveryFee: z.number().min(0).max(500),
  minimumOrder: z.number().min(0).max(10000),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  isActive: z.boolean().default(true),
});

export const restaurantPatchSchema = restaurantSchema.partial();

export const menuItemSchema = z.object({
  name: z.string().trim().min(2, "Item name is required").max(120),
  description: z.string().trim().max(500).default(""),
  category: z.string().trim().min(1, "Category is required").max(60),
  price: z.number().min(1, "Price must be positive").max(100000),
  isVeg: z.boolean(),
  isAvailable: z.boolean().default(true),
  imageUrl: z.string().trim().max(500).default(""),
});

export const menuItemPatchSchema = menuItemSchema.partial();

export const addressSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(40),
  line1: z.string().trim().min(2, "Address line is required").max(200),
  line2: z.string().trim().max(200).default(""),
  city: z.string().trim().min(2, "City is required").max(80),
  pincode: z.string().trim().min(4).max(12),
  phone: z.string().trim().min(7).max(20),
  isDefault: z.boolean().default(false),
});

export const addressPatchSchema = addressSchema.partial();

export const orderCreateSchema = z.object({
  addressId: objectId,
});

export const orderStatusSchema = z.object({
  status: z.enum(["confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"]),
  note: z.string().trim().max(200).default(""),
});

export const reviewCreateSchema = z.object({
  orderId: objectId,
  rating: z.number().int().min(1, "Rating must be between 1 and 5").max(5),
  text: z.string().trim().max(1000).default(""),
});

export const reviewPatchSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  text: z.string().trim().max(1000).optional(),
});

export { objectId };
