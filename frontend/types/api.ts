export type Role = "admin" | "supervisor" | "customer";

export type ApiSuccess<T> = {
  status: "success";
  data: T;
};

export type ApiMessageSuccess = {
  status: "success";
  message: string;
};

export type ApiError = {
  status?: "error";
  message: string;
  errors?: Record<string, string[]>;
};

export type UserSummary = {
  id: number | string;
  name: string;
  email: string;
  role: Role;
};

export type AuthPayload = {
  user: UserSummary;
  customer?: Record<string, unknown> | null;
  token?: string;
};
