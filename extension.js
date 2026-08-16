import St from "gi://St";
import GLib from "gi://GLib";
import GTop from "gi://GTop";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";

export default class RamSensor extends Extension {
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

    this.mem = new GTop.glibtop_mem();

    this.updateText();

    this.updateTimeout = GLib.timeout_add_seconds(
      GLib.PRIORITY_DEFAULT,
      5,
      this.updateText.bind(this),
    );
  }

  disable() {
    Main.panel._rightBox.remove_child(this.panelButton);
    if (this.updateTimeout) {
      GLib.Source.remove(this.updateTimeout);
      this.updateTimeout = null;
    }
    this.panelButton = null;
    this.panelButtonText = null;
    this.mem = null;
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
      GTop.glibtop_get_mem(this.mem);
      let usedMemPercentage = ((this.mem.user / this.mem.total) * 100).toFixed(
        1,
      );
      this.styleColors(usedMemPercentage);
      this.panelButtonText.set_text(`${usedMemPercentage}%`);
    } catch (e) {
      console.error(`Error updating RAM usage text: ${e.message}`);
      this.panelButtonText.set_text("Error");
    }
    return true;
  }
}
