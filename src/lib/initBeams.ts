import { beamsClient } from "../lib/beamsClient";
import { generateBeamsAuth } from "@/services/notificationService";

export const initBeams = async (userId: string) => {
  try {
    if (!("Notification" in window)) return;
    console.log("Notification", Notification.permission);

    if (Notification.permission === "denied") return;

    if (Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;
    }

    const token = await generateBeamsAuth();
    if (!token) {
      console.error("Failed to generate beams auth token");
      return;
    }

    await beamsClient.start();
    await beamsClient.setUserId(userId, token);

    console.log("✅ Beams initialized");
  } catch (err) {
    console.error("❌ Beams init failed", err);
  }
};
