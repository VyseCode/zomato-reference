import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IMenuItem {
  _id: Types.ObjectId;
  restaurant: Types.ObjectId;
  name: string;
  description: string;
  category: string;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const menuItemSchema = new Schema<IMenuItem>(
  {
    restaurant: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: "", maxlength: 500 },
    category: { type: String, required: true, trim: true, maxlength: 60 },
    price: { type: Number, required: true, min: 0, max: 100000 },
    isVeg: { type: Boolean, required: true },
    isAvailable: { type: Boolean, default: true },
    imageUrl: { type: String, default: "" },
  },
  { timestamps: true },
);

menuItemSchema.index({ restaurant: 1, name: 1 }, { unique: true });
menuItemSchema.index({ restaurant: 1, category: 1, isAvailable: 1 });

export const MenuItem: Model<IMenuItem> =
  (models.MenuItem as Model<IMenuItem>) ||
  model<IMenuItem>("MenuItem", menuItemSchema);
