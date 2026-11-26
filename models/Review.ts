import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IReview {
  _id: Types.ObjectId;
  order: Types.ObjectId;
  user: Types.ObjectId;
  restaurant: Types.ObjectId;
  rating: number;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },
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
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, default: "", maxlength: 1000 },
  },
  { timestamps: true },
);

reviewSchema.index({ restaurant: 1, createdAt: -1 });

export const Review: Model<IReview> =
  (models.Review as Model<IReview>) || model<IReview>("Review", reviewSchema);
