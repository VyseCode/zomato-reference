import { Schema, model, models, type Model, type Types } from "mongoose";

export type OrderStatus =
  | "placed"
  | "confirmed"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface IOrderItem {
  _id: Types.ObjectId;
  menuItem: Types.ObjectId;
  name: string;
  price: number;
  qty: number;
}

export interface IAddressSnapshot {
  label: string;
  line1: string;
  line2: string;
  city: string;
  pincode: string;
  phone: string;
}

export interface IOrderTimelineEntry {
  _id: Types.ObjectId;
  status: OrderStatus;
  at: Date;
  note: string;
}

export interface IOrder {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  restaurant: Types.ObjectId;
  address: Types.ObjectId;
  addressSnapshot: IAddressSnapshot;
  items: IOrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  timeline: IOrderTimelineEntry[];
  cancelReason: string;
  placedAt: Date;
  updatedAt: Date;
}

const STATUSES: OrderStatus[] = [
  "placed",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

const orderItemSchema = new Schema<IOrderItem>(
  {
    menuItem: {
      type: Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: true },
);

const addressSnapshotSchema = new Schema<IAddressSnapshot>(
  {
    label: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String, default: "" },
    city: { type: String, required: true },
    pincode: { type: String, required: true },
    phone: { type: String, required: true },
  },
  { _id: false },
);

const timelineSchema = new Schema<IOrderTimelineEntry>(
  {
    status: { type: String, enum: STATUSES, required: true },
    at: { type: Date, default: Date.now },
    note: { type: String, default: "" },
  },
  { _id: true },
);

const orderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    restaurant: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    address: {
      type: Schema.Types.ObjectId,
      ref: "Address",
      required: true,
    },
    addressSnapshot: { type: addressSnapshotSchema, required: true },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: STATUSES, default: "placed", index: true },
    timeline: { type: [timelineSchema], default: [] },
    cancelReason: { type: String, default: "" },
    placedAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);

orderSchema.index({ user: 1, placedAt: -1 });
orderSchema.index({ restaurant: 1, placedAt: -1 });
orderSchema.index({ status: 1, placedAt: -1 });

export const Order: Model<IOrder> =
  (models.Order as Model<IOrder>) || model<IOrder>("Order", orderSchema);
