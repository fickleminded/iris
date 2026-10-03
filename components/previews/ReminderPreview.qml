import QtQuick
import qs.Commons
import qs.Ui

Item {
  id: root

  property var item: null
  property string fontFamily: Style.font.menuFamily
  property color foreground: Color.menu.text
  property color accent: Color.accent
  property color border: Color.menu.border
  property int cornerRadius: Style.cornerRadius

  readonly property string kind: root.item && root.item.kind ? root.item.kind : "reminder-set"
  readonly property bool isClearMode: root.kind === "reminder-clear"
  readonly property bool isActiveListMode: root.kind === "reminder-active"
  readonly property bool isSetMode: root.kind === "reminder-set" || root.kind === "reminder-hint"
  readonly property bool isTimer: Boolean(root.item && root.item.isTimer)

  readonly property color urgentColor: Color.urgent || "#e05252"
  readonly property color actionColor: isClearMode ? root.urgentColor : (root.isTimer ? (Color.accent || "#ff9e3b") : root.accent)

  signal setRequested()
  signal clearRequested()
  signal interactiveRequested()
  signal dismissRequested()

  Column {
    anchors.fill: parent
    anchors.margins: Style.spacing.md
    spacing: Style.spacing.md

    // 1. Header Section: Icon, Badge, and Subtitle
    Row {
      width: parent.width
      spacing: Style.spacing.md

      Item {
        width: Style.space(48)
        height: Style.space(48)
        anchors.verticalCenter: parent.verticalCenter

        Rectangle {
          anchors.fill: parent
          radius: Style.space(12)
          color: Util.alpha(root.actionColor, 0.16)

          Text {
            anchors.centerIn: parent
            text: root.item && root.item.icon ? root.item.icon : (root.isClearMode ? "󰅖" : (root.isTimer ? "󰔟" : "󰢌"))
            font.family: root.fontFamily
            font.pixelSize: Style.space(24)
            color: root.actionColor
          }
        }
      }

      Column {
        width: parent.width - Style.space(48) - parent.spacing
        anchors.verticalCenter: parent.verticalCenter
        spacing: Style.space(2)

        Row {
          width: parent.width
          spacing: Style.spacing.sm

          Text {
            text: root.item && root.item.badge ? root.item.badge : (root.isTimer ? "TIMER" : "REMINDER")
            textFormat: Text.PlainText
            font.family: root.fontFamily
            font.pixelSize: Style.font.caption
            font.bold: true
            color: root.actionColor
            elide: Text.ElideRight
          }

          Rectangle {
            visible: root.isSetMode && Boolean(root.item && root.item.atTime)
            anchors.verticalCenter: parent.verticalCenter
            height: Style.space(16)
            width: targetTimeText.implicitWidth + Style.spacing.xs * 2
            radius: Style.space(3)
            color: Util.alpha(root.actionColor, 0.18)

            Text {
              id: targetTimeText
              anchors.centerIn: parent
              text: "AT " + (root.item && root.item.atTime ? root.item.atTime : "")
              textFormat: Text.PlainText
              font.family: root.fontFamily
              font.pixelSize: Math.max(8, Style.font.caption - 2)
              font.bold: true
              color: root.actionColor
            }
          }
        }

        Text {
          width: parent.width
          text: root.item && root.item.name ? root.item.name : (root.isTimer ? "Countdown Timer" : "Desktop Reminder")
          textFormat: Text.PlainText
          font.family: root.fontFamily
          font.pixelSize: Style.font.title
          font.bold: true
          color: root.foreground
          elide: Text.ElideRight
        }
      }
    }

    // Divider
    Rectangle {
      width: parent.width
      height: 1
      color: root.border
      opacity: 0.4
    }

    // 2. Hero Card: Mode-Specific Highlights
    Rectangle {
      width: parent.width
      height: Math.max(Style.space(84), heroColumn.implicitHeight + Style.spacing.md * 2)
      radius: root.cornerRadius
      color: Util.alpha(root.actionColor, 0.08)
      border.color: Util.alpha(root.actionColor, 0.28)
      border.width: 1

      Column {
        id: heroColumn
        anchors.centerIn: parent
        width: parent.width - Style.spacing.md * 2
        spacing: Style.space(4)

        // Subtitle / Label
        Text {
          anchors.horizontalCenter: parent.horizontalCenter
          text: root.isClearMode
            ? "SCHEDULED TIMERS CANCELLATION"
            : (root.isActiveListMode
                ? "OMARCHY ACTIVE TIMERS"
                : (root.isTimer ? "COUNTDOWN DURATION" : "SCHEDULED REMINDER"))
          textFormat: Text.PlainText
          font.family: root.fontFamily
          font.pixelSize: Math.max(8, Style.font.caption - 1)
          font.bold: true
          color: root.actionColor
          opacity: 0.8
        }

        // Primary Hero Text
        Text {
          anchors.horizontalCenter: parent.horizontalCenter
          width: parent.width
          text: {
            if (root.isClearMode) return "Stop All Active Timers";
            if (root.isActiveListMode) {
              var count = root.item && typeof root.item.count === "number" ? root.item.count : 0;
              return count > 0 ? (count + " Active " + (count === 1 ? "Timer" : "Timers")) : "No Active Timers";
            }
            var mins = root.item && root.item.minutes ? root.item.minutes : 1;
            return "In " + mins + " " + (mins === 1 ? "minute" : "minutes");
          }
          textFormat: Text.PlainText
          font.family: root.fontFamily
          font.pixelSize: Style.space(26)
          font.bold: true
          color: root.actionColor
          horizontalAlignment: Text.AlignHCenter
          elide: Text.ElideRight
          maximumLineCount: 1
        }

        // Target fire time indicator
        Text {
          visible: root.isSetMode && Boolean(root.item && root.item.atTime)
          anchors.horizontalCenter: parent.horizontalCenter
          text: "Will notify at " + (root.item && root.item.atTime ? root.item.atTime : "") + " via desktop notification"
          textFormat: Text.PlainText
          font.family: root.fontFamily
          font.pixelSize: Style.font.caption
          color: root.foreground
          opacity: 0.65
        }
      }
    }

    // 3. Middle Detail Section: Mode-Specific View
    Item {
      width: parent.width
      height: Style.space(130)

      // VIEW A: Set Mode - Message Card & CLI Command Box
      Column {
        visible: root.isSetMode
        anchors.fill: parent
        spacing: Style.spacing.sm

        // Message callout
        Rectangle {
          width: parent.width
          height: Style.space(64)
          radius: root.cornerRadius
          color: Util.alpha(root.foreground, 0.04)
          border.color: root.border
          border.width: 1

          Column {
            anchors.fill: parent
            anchors.margins: Style.spacing.sm
            spacing: Style.space(2)

            Row {
              spacing: Style.spacing.xs
              Text {
                text: "󰢌"
                font.family: root.fontFamily
                font.pixelSize: Style.font.caption
                color: root.actionColor
              }
              Text {
                text: "Notification Message"
                font.family: root.fontFamily
                font.pixelSize: Math.max(9, Style.font.caption - 1)
                font.bold: true
                color: root.foreground
                opacity: 0.6
              }
            }

            Text {
              width: parent.width
              text: root.item && root.item.message && root.item.message.length > 0
                ? ("“" + root.item.message + "”")
                : ("“Your " + (root.item && root.item.minutes ? root.item.minutes : 1) + " minutes are up” (default)")
              textFormat: Text.PlainText
              font.family: root.fontFamily
              font.pixelSize: Style.font.body
              color: root.foreground
              elide: Text.ElideRight
              maximumLineCount: 1
            }
          }
        }

        // Monospace CLI Preview Box
        Rectangle {
          width: parent.width
          height: Style.space(56)
          radius: root.cornerRadius
          color: Util.alpha(root.foreground, 0.03)
          border.color: root.border
          border.width: 1

          Column {
            anchors.fill: parent
            anchors.margins: Style.spacing.sm
            spacing: Style.space(2)

            Text {
              text: "CLI Execution"
              textFormat: Text.PlainText
              font.family: root.fontFamily
              font.pixelSize: Math.max(9, Style.font.caption - 1)
              color: root.foreground
              opacity: 0.5
            }

            Text {
              width: parent.width
              text: ">_ " + (root.item && root.item.command ? root.item.command : "omarchy reminder")
              textFormat: Text.PlainText
              font.family: Style.font.monospace
              font.pixelSize: Math.max(10, Style.font.caption)
              color: root.accent
              elide: Text.ElideRight
            }
          }
        }
      }

      // VIEW B: Active Timers List View
      Column {
        visible: root.isActiveListMode
        anchors.fill: parent
        spacing: Style.spacing.sm

        // If timers exist, show list
        ListView {
          visible: Boolean(root.item && root.item.active && root.item.reminders && root.item.reminders.length > 0)
          width: parent.width
          height: parent.height
          clip: true
          spacing: Style.space(4)
          model: root.item && root.item.reminders ? root.item.reminders : []

          delegate: Rectangle {
            id: reminderDelegate
            required property var modelData
            width: parent.width
            height: Style.space(38)
            radius: Style.space(6)
            color: Util.alpha(root.foreground, 0.04)
            border.color: root.border
            border.width: 1

            Row {
              anchors.fill: parent
              anchors.leftMargin: Style.spacing.sm
              anchors.rightMargin: Style.spacing.sm
              spacing: Style.spacing.sm

              Text {
                anchors.verticalCenter: parent.verticalCenter
                text: "󰢌"
                font.family: root.fontFamily
                font.pixelSize: Style.font.body
                color: root.accent
              }

              Text {
                width: parent.width - Style.space(160)
                anchors.verticalCenter: parent.verticalCenter
                text: reminderDelegate.modelData.message || reminderDelegate.modelData.label || "Reminder"
                textFormat: Text.PlainText
                font.family: root.fontFamily
                font.pixelSize: Style.font.caption
                font.bold: true
                color: root.foreground
                elide: Text.ElideRight
              }

              Rectangle {
                anchors.verticalCenter: parent.verticalCenter
                height: Style.space(20)
                width: remainingText.implicitWidth + Style.spacing.sm * 2
                radius: Style.space(4)
                color: Util.alpha(root.accent, 0.16)

                Text {
                  id: remainingText
                  anchors.centerIn: parent
                  text: (reminderDelegate.modelData.remaining || "") + " left"
                  textFormat: Text.PlainText
                  font.family: root.fontFamily
                  font.pixelSize: Math.max(9, Style.font.caption - 1)
                  font.bold: true
                  color: root.accent
                }
              }

              Text {
                anchors.verticalCenter: parent.verticalCenter
                text: reminderDelegate.modelData.atTime ? ("@" + reminderDelegate.modelData.atTime) : ""
                textFormat: Text.PlainText
                font.family: root.fontFamily
                font.pixelSize: Math.max(9, Style.font.caption - 1)
                color: root.foreground
                opacity: 0.5
              }
            }
          }
        }

        // Empty state when no timers are running
        Rectangle {
          visible: !Boolean(root.item && root.item.active && root.item.reminders && root.item.reminders.length > 0)
          anchors.fill: parent
          radius: root.cornerRadius
          color: Util.alpha(root.foreground, 0.03)
          border.color: root.border
          border.width: 1

          Column {
            anchors.centerIn: parent
            spacing: Style.space(4)

            Text {
              anchors.horizontalCenter: parent.horizontalCenter
              text: "󰢌"
              font.family: root.fontFamily
              font.pixelSize: Style.space(28)
              color: root.foreground
              opacity: 0.3
            }

            Text {
              anchors.horizontalCenter: parent.horizontalCenter
              text: "No active reminder timers"
              font.family: root.fontFamily
              font.pixelSize: Style.font.caption
              font.bold: true
              color: root.foreground
              opacity: 0.6
            }

            Text {
              anchors.horizontalCenter: parent.horizontalCenter
              text: "Type \"remind 10m check oven\" or \"timer 25m\""
              font.family: root.fontFamily
              font.pixelSize: Math.max(9, Style.font.caption - 2)
              color: root.foreground
              opacity: 0.4
            }
          }
        }
      }

      // VIEW C: Clear Mode - Warning Notice Card
      Rectangle {
        visible: root.isClearMode
        anchors.fill: parent
        radius: root.cornerRadius
        color: Util.alpha(root.urgentColor, 0.06)
        border.color: Util.alpha(root.urgentColor, 0.3)
        border.width: 1

        Column {
          anchors.fill: parent
          anchors.margins: Style.spacing.md
          spacing: Style.space(6)

          Row {
            spacing: Style.spacing.sm
            Text {
              text: "󰀦"
              font.family: root.fontFamily
              font.pixelSize: Style.font.title
              color: root.urgentColor
            }
            Text {
              text: "Destructive Action Warning"
              font.family: root.fontFamily
              font.pixelSize: Style.font.caption
              font.bold: true
              color: root.urgentColor
            }
          }

          Text {
            width: parent.width
            text: "This command will immediately terminate all scheduled user timers matching omarchy-reminder-*.timer and remove outstanding reminder notifications."
            font.family: root.fontFamily
            font.pixelSize: Style.font.caption
            color: root.foreground
            opacity: 0.75
            wrapMode: Text.WordWrap
          }
        }
      }
    }

    // 4. Action Toolbar / Keyboard Shortcuts
    Row {
      width: parent.width
      height: Style.space(32)
      spacing: Style.spacing.sm

      // Primary Action Button
      Rectangle {
        id: actionButton
        height: parent.height
        width: buttonContent.implicitWidth + Style.spacing.md * 2
        radius: Style.space(6)
        color: actionMouse.containsMouse ? root.actionColor : Util.alpha(root.actionColor, 0.16)
        border.color: root.actionColor
        border.width: 1

        Behavior on color {
          ColorAnimation { duration: 120 }
        }

        Row {
          id: buttonContent
          anchors.centerIn: parent
          spacing: Style.spacing.xs

          Text {
            text: root.isClearMode ? "󰅖" : (root.isActiveListMode ? "󰢌" : "󰔟")
            font.family: root.fontFamily
            font.pixelSize: Style.font.caption
            color: actionMouse.containsMouse ? Color.menu.background : root.actionColor
          }

          Text {
            text: root.isClearMode
              ? "Clear All Timers [↵]"
              : (root.isActiveListMode
                  ? "Open Interactive Reminders [↵]"
                  : (root.isTimer ? "Start Timer [↵]" : "Set Reminder [↵]"))
            font.family: root.fontFamily
            font.pixelSize: Math.max(9, Style.font.caption)
            font.bold: true
            color: actionMouse.containsMouse ? Color.menu.background : root.actionColor
          }
        }

        MouseArea {
          id: actionMouse
          anchors.fill: parent
          hoverEnabled: true
          cursorShape: Qt.PointingHandCursor
          onClicked: {
            if (root.isClearMode) {
              root.clearRequested()
            } else if (root.isActiveListMode) {
              root.interactiveRequested()
            } else {
              root.setRequested()
            }
          }
        }
      }

      // Secondary Action: Clear button if active timers exist
      Rectangle {
        id: clearButton
        visible: root.isActiveListMode && Boolean(root.item && root.item.active)
        height: parent.height
        width: clearBtnContent.implicitWidth + Style.spacing.md * 2
        radius: Style.space(6)
        color: clearBtnMouse.containsMouse ? root.urgentColor : Util.alpha(root.urgentColor, 0.14)
        border.color: root.urgentColor
        border.width: 1

        Behavior on color {
          ColorAnimation { duration: 120 }
        }

        Row {
          id: clearBtnContent
          anchors.centerIn: parent
          spacing: Style.spacing.xs

          Text {
            text: "󰅖"
            textFormat: Text.PlainText
            font.family: root.fontFamily
            font.pixelSize: Style.font.caption
            color: clearBtnMouse.containsMouse ? Color.menu.background : root.urgentColor
          }

          Text {
            text: "Clear All [Alt+C]"
            textFormat: Text.PlainText
            font.family: root.fontFamily
            font.pixelSize: Math.max(9, Style.font.caption)
            font.bold: true
            color: clearBtnMouse.containsMouse ? Color.menu.background : root.urgentColor
          }
        }

        MouseArea {
          id: clearBtnMouse
          anchors.fill: parent
          hoverEnabled: true
          cursorShape: Qt.PointingHandCursor
          onClicked: root.clearRequested()
        }
      }

      // Spacer
      Item {
        width: Math.max(0, parent.width - actionButton.width - (clearButton.visible ? (clearButton.width + parent.spacing) : 0) - dismissHint.implicitWidth - parent.spacing)
        height: parent.height
      }

      // Dismiss shortcut hint
      Text {
        id: dismissHint
        anchors.verticalCenter: parent.verticalCenter
        text: "[Esc] Dismiss"
        textFormat: Text.PlainText
        font.family: root.fontFamily
        font.pixelSize: Math.max(9, Style.font.caption - 1)
        color: root.foreground
        opacity: 0.4
      }
    }
  }
}
