import type { ObjectId } from "mongodb";

export interface ItemDoc {
  _id?: ObjectId;
  title: string;
  category: string; // stored as the category name
  imageUrl: string;
  thumbUrl: string;
  fullImageUrl: string;
  description: string;
  tags: string[];
  captureDate: Date | null;
  captureDateText: string;
  sourceUrl: string;
  sourceUrl2: string;
  takenBy: string;
  device: string; // camera / instrument used — nullable
  license: string;
  note: string;
  width: number | null;
  height: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryDoc {
  _id?: ObjectId;
  name: string;
  slug: string;
  description: string;
  createdAt: Date;
}

/** Shape sent to the client. */
export interface Item {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  thumbUrl: string;
  fullImageUrl: string;
  description: string;
  tags: string[];
  captureDate: string;
  sourceUrl: string;
  sourceUrl2: string;
  takenBy: string;
  device: string;
  license: string;
  note: string;
  width: number | null;
  height: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  count?: number;
  createdAt: string | null;
}

export interface ItemInput {
  title?: string;
  category?: string;
  imageUrl?: string;
  thumbUrl?: string;
  fullImageUrl?: string;
  description?: string;
  tags?: string | string[];
  captureDate?: string;
  sourceUrl?: string;
  sourceUrl2?: string;
  takenBy?: string;
  device?: string;
  license?: string;
  note?: string;
  width?: number | string | null;
  height?: number | string | null;
}
