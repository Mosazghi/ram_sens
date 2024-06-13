import St from "gi://St";
import GLib from "gi://GLib";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";

export default class PlainExampleExtension extends Extension {
  enable() {
    this.panelButton = new St.Bin({ style_class: "panel-button" });
    this.panelButtonText = new St.Label({
      style_class: "panel-button-text",
      text: "Loading...",
    });

    this.panelButton.set_child(this.panelButtonText);
    Main.panel._rightBox.insert_child_at_index(this.panelButton, 1);
    if (this.updateTimeout) {
      GLib.Source.remove(this.updateTimeout);
    }
    this.updateTimeout = GLib.timeout_add_seconds(
      GLib.PRIORITY_DEFAULT,
      30,
      this.updateText.bind(this),
    );
  }

  disable() {
    Main.panel._rightBox.remove_child(this.panelButton);
    if (this.updateTimeout) {
      GLib.Source.remove(this.updateTimeout);
      this.updateTimeout = null;
    }
  }

  styleColors(value) {
    if (value <= 50) {
      this.panelButtonText.style = "color: #00FF00;"; // Green
    } else if (value <= 75) {
      this.panelButtonText.style = "color: #FFFF00;"; // Yellow
    } else {
      this.panelButtonText.style = "color: #FF0000;"; // Red
    }
  }

  updateText() {
    try {
      const [ok, out, _, exit] = GLib.spawn_command_line_sync("free -m");
      if (!ok || exit !== 0 || !out) {
        throw new Error("Failed to execute free -m command");
      }

      const memLine = out
        .toString()
        .split("\n")
        .find((line) => line.includes("Mem:"));

      if (!memLine) {
        throw new Error("Memory line not found in command output");
      }
      const parts = memLine.split(/\s+/);

      if (parts.length < 7) {
        throw new Error("Unexpected format of free command output");
      }

      const availableMemory = parts[parts.length - 1];

      if (!this.isValidMemoryValue(availableMemory)) {
        throw new Error("Invalid available memory value: " + availableMemory);
      }

      const totalMemory = parts[1]; // Consider making this dynamic if possible

      if (!this.isValidMemoryValue(totalMemory)) {
        throw new Error("Invalid total memory value: " + totalMemory);
      }

      const usedMemory = totalMemory - parseInt(availableMemory, 10);
      const usedMemoryPercentage = ((usedMemory / totalMemory) * 100).toFixed(
        0,
      );

      this.styleColors(usedMemoryPercentage);
      this.panelButtonText.set_text(`${usedMemoryPercentage}%`);
    } catch (e) {
      log(`Error updating RAM usage text: ${e.message}`);
      this.panelButtonText.set_text("Error");
    }

    return true;
  }

  isValidMemoryValue(value) {
    const num = parseInt(value, 10);
    return !isNaN(num) && isFinite(num) && num >= 0;
  }
}
