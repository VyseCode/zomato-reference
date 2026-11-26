import { Schema, model, models, type Model, type Types } from "mongoose";

export type Role = "customer" | "partner";

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  roles: Role[];
  phone: string;
  avatarUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    roles: {
      type: [{ type: String, enum: ["customer", "partner"] }],
      default: ["customer"],
    },
    phone: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
  },
  { timestamps: true },
);

userSchema.index({ name: "text" });

export const User: Model<IUser> =
  (models.User as Model<IUser>) || model<IUser>("User", userSchema);
