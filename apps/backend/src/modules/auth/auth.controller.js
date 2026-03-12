import { getUserById, loginUser, registerUser } from "./auth.service.js";

export async function register(req, res) {
  try {
    const result = await registerUser(req.body);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

export async function login(req, res) {
  try {
    const result = await loginUser(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
}

export async function me(req, res) {
  try {
    const user = await getUserById(req.user.sub);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ user });
  } catch {
    return res.status(500).json({ message: "Unexpected error" });
  }
}
