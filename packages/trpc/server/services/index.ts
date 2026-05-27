import UserService from "@repo/services/user";
import { AuthService } from "@repo/services/auth";
import { FormService } from "@repo/services/form";

export const userService = new UserService();
export const authService = new AuthService();
export const formService = new FormService();
