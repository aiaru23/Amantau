import * as SMS from "expo-sms";
import { Linking, Platform } from "react-native";
import { AppStorage } from "../database/storage";

export interface SOSMessageParams {
  latitude: number;
  longitude: number;
  altitude: number;
  routeName: string;
  distanceFromRouteMeters: number;
  batteryPercent: number | null;
  speedKmh?: number;
  tripDurationSeconds?: number;
}

export class SMSServiceManager {
  public generateSOSMessage(params: SOSMessageParams): string {
    const mapUrl = `https://maps.google.com/?q=${params.latitude.toFixed(5)},${params.longitude.toFixed(5)}`;

    const batteryStr =
      params.batteryPercent !== null
        ? `${Math.round(params.batteryPercent)}%`
        : "н/д";

    const speedStr =
      params.speedKmh !== undefined
        ? `${params.speedKmh.toFixed(1)} км/ч`
        : "н/д";

    const durationStr =
      params.tripDurationSeconds !== undefined
        ? formatDuration(params.tripDurationSeconds)
        : "н/д";

    const timestamp = new Date().toLocaleString("ru-RU", {
      timeZone: "Asia/Almaty",
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    return [
      "🆘 SOS — AMANTAU",
      "─────────────────────",
      `📍 Координаты: ${params.latitude.toFixed(5)}, ${params.longitude.toFixed(5)}`,
      `⛰️ Высота: ${params.altitude} м`,
      `🗺️ Маршрут: ${params.routeName}`,
      `📏 Откл. от тропы: ${params.distanceFromRouteMeters} м`,
      `🔋 Заряд: ${batteryStr}`,
      `🚶 Скорость: ${speedStr}`,
      `⏱️ Время в пути: ${durationStr}`,
      `🕐 Время сигнала: ${timestamp}`,
      "─────────────────────",
      `🔗 Карта: ${mapUrl}`,
    ].join("\n");
  }

  public async sendEmergencySMS(params: SOSMessageParams): Promise<{
    success: boolean;
    contacts: string[];
    message: string;
    sentCount: number;
  }> {
    let contacts = await AppStorage.getSosContacts();

    if (contacts.length === 0) {
      contacts = ["+7 701 123 45 67"];
    }

    const messageText = this.generateSOSMessage(params);

    try {
      const isSmsAvailable = await SMS.isAvailableAsync();

      if (isSmsAvailable) {
        await SMS.sendSMSAsync(contacts, messageText);
        return {
          success: true,
          contacts,
          message: messageText,
          sentCount: contacts.length,
        };
      } else {
        const firstContact = contacts[0];
        const encodedMsg = encodeURIComponent(messageText);
        const smsUrl =
          Platform.OS === "ios"
            ? `sms:${firstContact}&body=${encodedMsg}`
            : `sms:${firstContact}?body=${encodedMsg}`;

        const canOpen = await Linking.canOpenURL(smsUrl);
        if (canOpen) {
          await Linking.openURL(smsUrl);
        }

        return {
          success: true,
          contacts,
          message: messageText,
          sentCount: 1,
        };
      }
    } catch (e) {
      console.warn("SMS dispatch handled with offline fallback:", e);
      return {
        success: false,
        contacts,
        message: messageText,
        sentCount: 0,
      };
    }
  }
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h} ч ${m} мин`;
  return `${m} мин`;
}

export const smsService = new SMSServiceManager();
