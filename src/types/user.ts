export type UserProfile = {
  uid: string;
  nickname: string;
  bio: string;
  age: number;
  gender: "male" | "female" | "other";
  avatarUrl: string;
  createdAt: Date;
  updatedAt: Date;
};
