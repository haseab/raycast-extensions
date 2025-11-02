import { LocalStorage, open } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import * as chrono from "chrono-node";

export default async function Command(props: { arguments: { time: string } }) {
  const timeInput = props.arguments.time;

  if (!timeInput) {
    await showFailureToast("No time input provided");
    return;
  }

  try {
    let parsedDate: Date | null = null;

    // Check if the input matches the "y<number>" pattern (e.g., "y1", "y2", "y3")
    const yPattern = /^y(\d+)(?:\s+(.+))?$/i;
    const match = timeInput.match(yPattern);

    if (match) {
      const daysAgo = parseInt(match[1], 10);
      const timeStr = match[2]; // Optional time part (e.g., "2:05pm" or "14:05")

      // Calculate the date X days ago
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - daysAgo);

      if (timeStr) {
        // Check if timeStr is a 24h format without colon (e.g., "1405" or "205")
        const digitPattern = /^(\d{3,4})$/;
        const digitMatch = timeStr.match(digitPattern);

        if (digitMatch) {
          const digits = digitMatch[1].padStart(4, "0"); // Pad "205" to "0205"
          const hours = parseInt(digits.slice(0, 2), 10);
          const minutes = parseInt(digits.slice(2, 4), 10);

          if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
            targetDate.setHours(hours);
            targetDate.setMinutes(minutes);
            targetDate.setSeconds(0);
            targetDate.setMilliseconds(0);
          } else {
            await showFailureToast("Invalid time format");
            return;
          }
        } else {
          // Parse the time part using chrono
          const parsedTime = chrono.parseDate(timeStr);
          if (parsedTime) {
            // Apply the time to the target date
            targetDate.setHours(parsedTime.getHours());
            targetDate.setMinutes(parsedTime.getMinutes());
            targetDate.setSeconds(parsedTime.getSeconds());
            targetDate.setMilliseconds(parsedTime.getMilliseconds());
          } else {
            await showFailureToast("Could not parse the time portion");
            return;
          }
        }
      } else {
        // No time specified, use the current time on that day
        const now = new Date();
        targetDate.setHours(now.getHours());
        targetDate.setMinutes(now.getMinutes());
        targetDate.setSeconds(now.getSeconds());
        targetDate.setMilliseconds(now.getMilliseconds());
      }

      parsedDate = targetDate;
    } else {
      // Fall back to chrono's natural language parsing
      parsedDate = chrono.parseDate(timeInput);
    }

    if (!parsedDate) {
      await showFailureToast("Could not parse the time input");
      return;
    }

    // Convert to Unix timestamp in seconds
    const timestamp = Math.floor(parsedDate.getTime() / 1000);

    // Store the timestamp for future use
    await LocalStorage.setItem("lastRewindTimestamp", timestamp);

    // Create the Rewind AI deeplink
    const deeplink = `rewindai://show-moment?timestamp=${timestamp}`;
    // Open the deeplink
    await open(deeplink);
  } catch (error: unknown) {
    await showFailureToast(error, { title: "Error processing time input" });
  }
}
