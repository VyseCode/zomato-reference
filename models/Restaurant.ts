import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IRestaurant {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
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
  createdAt: Date;
  updatedAt: Date;
}

const restaurantSchema = new Schema<IRestaurant>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    cuisines: { type: [String], default: [] },
    area: { type: String, required: true, trim: true, maxlength: 80 },
    address: { type: String, default: "" },
    description: { type: String, default: "", maxlength: 1000 },
    imageUrl: { type: String, default: "" },
    etaMinutes: { type: Number, required: true, min: 5, max: 180 },
    deliveryFee: { type: Number, required: true, min: 0, max: 500 },
    minimumOrder: { type: Number, required: true, min: 0, max: 10000 },
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

restaurantSchema.index({ name: "text", cuisines: "text", area: "text" });
restaurantSchema.index({ area: 1, isActive: 1, ratingAvg: -1 });
restaurantSchema.index({ isActive: 1, createdAt: -1 });
restaurantSchema.index({ owner: 1, createdAt: -1 });

export const Restaurant: Model<IRestaurant> =
  (models.Restaurant as Model<IRestaurant>) ||
  model<IRestaurant>("Restaurant", restaurantSchema);
