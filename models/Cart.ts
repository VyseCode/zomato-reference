import { Schema, model, models, type Model, type Types } from "mongoose";

export interface ICartItem {
  _id: Types.ObjectId;
  menuItem: Types.ObjectId;
  name: string;
  price: number;
  qty: number;
  isVeg: boolean;
}

export interface ICart {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  restaurant: Types.ObjectId | null;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    menuItem: {
      type: Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1, max: 50 },
    isVeg: { type: Boolean, required: true },
  },
  { _id: true },
);

const cartSchema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    restaurant: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      default: null,
    },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true },
);

export const Cart: Model<ICart> =
  (models.Cart as Model<ICart>) || model<ICart>("Cart", cartSchema);
