import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

let cachedId: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cachedId) return cachedId;
  let id = await SecureStore.getItemAsync("rezo_device_id");
  if (!id) {
    id = Crypto.randomUUID();
    await SecureStore.setItemAsync("rezo_device_id", id);
  }
  cachedId = id;
  return id;
}
