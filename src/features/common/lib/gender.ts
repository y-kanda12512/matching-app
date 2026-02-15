const genderLabels: Record<string, string> = {
  male: "男性",
  female: "女性",
  other: "その他",
};

export function getGenderLabel(gender: string): string {
  return genderLabels[gender] || gender;
}
