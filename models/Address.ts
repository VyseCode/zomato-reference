import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IAddress {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  label: string;
  line1: string;
  line2: string;
  city: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    label: { type: String, required: true, trim: true, maxlength: 40 },
    line1: { type: String, required: true, trim: true, maxlength: 200 },
    line2: { type: String, default: "", maxlength: 200 },
    city: { type: String, required: true, trim: true, maxlength: 80 },
    pincode: { type: String, required: true, trim: true, maxlength: 12 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

addressSchema.index({ user: 1, createdAt: -1 });

export const Address: Model<IAddress> =
  (models.Address as Model<IAddress>) ||
  model<IAddress>("Address", addressSchema);
