import * as PusherPushNotifications from "@pusher/push-notifications-web";

const BEAMS_INSTANCE_ID = import.meta.env.VITE_PUSHER_BEAMS_INSTANCE_ID;

if (!BEAMS_INSTANCE_ID) {
  console.error(
    "Pusher Beams instance ID is not set (VITE_PUSHER_BEAMS_INSTANCE_ID)",
  );
  throw new Error("Pusher Beams instance ID is not set");
}

export const beamsClient = new PusherPushNotifications.Client({
  instanceId: BEAMS_INSTANCE_ID,
});
