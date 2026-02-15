export type UserProfile = {
  uid: string;
  nickname: string;
  bio: string;
  age: number;
  gender: "male" | "female" | "other";
  createdAt: Date;
  updatedAt: Date;
};
